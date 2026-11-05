"""
Observer Pattern implementation for ProcessingJob status changes.

Observer Pattern (GoF) — igual al ejemplo de WeatherStation de Head First Design Patterns:
    El 'Subject' es ProcessingJob (a través del mixin JobSubjectMixin).
    Los 'ConcreteObservers' son LoggingJobObserver, StatsJobObserver y NotificationJobObserver.

Jerarquía:
    IJobObserver (ABC)              ← Observer abstracto
    ├── LoggingJobObserver          ← ConcreteObserver: audit trail de cambios de estado
    ├── StatsJobObserver            ← ConcreteObserver: contadores en memoria
    └── NotificationJobObserver     ← ConcreteObserver: historial de alertas/notificaciones

    JobSubjectMixin                 ← Mixin para agregar comportamiento Subject a ProcessingJob
        + register_observer(obs)
        + remove_observer(obs)
        + notify_observers(old_status, new_status, context)

Comparativa Modelo Push vs. Modelo Pull (Material de Cátedra — Patron_Observer.pdf):
    - Modelo Push (implementado aquí):
      El Subject envía en `update(job_id, old_status, new_status, context)` todos los
      datos relevantes del evento. Ventaja crítica en nuestro dominio: ProcessingJob es
      una entidad ORM asociada a una sesión de base de datos efímera (`SessionLocal()`
      en BackgroundTasks). Al empujar valores primitivos/diccionarios, los Observers
      pueden almacenar estadísticas y notificaciones en memoria sin sufrir errores de
      `DetachedInstanceError` de SQLAlchemy cuando la sesión se cierra.
    - Modelo Pull (alternativa clásica vista en WeatherStation):
      El Subject envía `update(subject)` y cada Observer invoca getters (`subject.get_status()`).
      Es preferible cuando el Subject vive en memoria con múltiples atributos y cada
      Observer necesita un subconjunto distinto de propiedades.
"""
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


# ─── Observer (Interface) ────────────────────────────────────────────────────

class IJobObserver(ABC):
    """
    Interfaz abstracta Observer.
    Todo Observer concreto debe implementar update().

    Firma push: recibe todos los datos que necesita directamente,
    sin necesidad de consultar el Subject ni depender de su sesión ORM.
    """

    @abstractmethod
    def update(
        self,
        job_id: int,
        old_status: Any,
        new_status: Any,
        context: dict | None = None,
    ) -> None:
        """
        Notificación de cambio de estado en el Job.

        Args:
            job_id:     ID del ProcessingJob que cambió.
            old_status: El JobStatus anterior.
            new_status: El JobStatus nuevo.
            context:    Información adicional opcional (ej: processed_items, error, brand_id).
        """
        pass


# ─── Concrete Observers ──────────────────────────────────────────────────────

class LoggingJobObserver(IJobObserver):
    """
    ConcreteObserver que registra cada transición de estado del Job
    como un audit trail en el sistema de logging.
    """

    def update(
        self,
        job_id: int,
        old_status: Any,
        new_status: Any,
        context: dict | None = None,
    ) -> None:
        old_name = old_status.value if hasattr(old_status, "value") else str(old_status)
        new_name = new_status.value if hasattr(new_status, "value") else str(new_status)
        ctx_str = ""
        if context:
            ctx_str = " | " + " | ".join(f"{k}={v}" for k, v in context.items())
        logger.info(
            "[Observer:Logging] Job #%d: %s → %s%s",
            job_id, old_name, new_name, ctx_str,
        )


class StatsJobObserver(IJobObserver):
    """
    ConcreteObserver que mantiene contadores en memoria sobre
    el resultado de los jobs de procesamiento.

    Análogo a StatisticsDisplay en la WeatherStation del libro:
    acumula datos históricos de las notificaciones recibidas.
    """

    def __init__(self) -> None:
        self.jobs_completed: int = 0
        self.jobs_failed: int = 0
        self.total_garments_processed: int = 0

    def update(
        self,
        job_id: int,
        old_status: Any,
        new_status: Any,
        context: dict | None = None,
    ) -> None:
        new_name = new_status.value if hasattr(new_status, "value") else str(new_status)

        if new_name == "READY":
            self.jobs_completed += 1
            if context and "processed_items" in context:
                self.total_garments_processed += int(context["processed_items"])
            logger.info(
                "[Observer:Stats] Jobs completados=%d | Prendas totales=%d",
                self.jobs_completed,
                self.total_garments_processed,
            )

        elif new_name == "FAILED":
            self.jobs_failed += 1
            logger.warning(
                "[Observer:Stats] Jobs fallidos=%d | Job #%d falló",
                self.jobs_failed, job_id,
            )

    def summary(self) -> dict:
        """Retorna un resumen del estado actual de las estadísticas."""
        return {
            "jobs_completed": self.jobs_completed,
            "jobs_failed": self.jobs_failed,
            "total_garments_processed": self.total_garments_processed,
        }


class NotificationJobObserver(IJobObserver):
    """
    ConcreteObserver que registra y almacena notificaciones ante transiciones
    de estado críticas de un Job (cumpliendo RQ5 y demostrando OCP).

    Mantiene un historial acotado en memoria (`notifications`) consultable vía API
    por el Dashboard de Marca para visualizar las alertas generadas en tiempo real.
    """

    MAX_HISTORY = 50

    def __init__(self, notify_on: set[str] | None = None) -> None:
        self._notify_on: set[str] = notify_on or {"READY", "FAILED"}
        self.notifications: list[dict] = []

    def update(
        self,
        job_id: int,
        old_status: Any,
        new_status: Any,
        context: dict | None = None,
    ) -> None:
        old_name = old_status.value if hasattr(old_status, "value") else str(old_status)
        new_name = new_status.value if hasattr(new_status, "value") else str(new_status)

        if new_name not in self._notify_on:
            return  # Transición intermedia: no se notifica

        now_iso = datetime.now(timezone.utc).isoformat()
        brand_id = context.get("brand_id") if context else None

        if new_name == "READY":
            processed = context.get("processed_items", "?") if context else "?"
            message = f"Job #{job_id} completado exitosamente ({processed} prendas procesadas)."
            logger.info(
                "[Observer:Notification] NOTIFICACION: %s",
                message,
            )
            self._append_event(
                job_id=job_id,
                old_status=old_name,
                new_status=new_name,
                level="SUCCESS",
                message=message,
                brand_id=brand_id,
                timestamp=now_iso,
            )
        elif new_name == "FAILED":
            error = context.get("error", "error desconocido") if context else "error desconocido"
            message = f"Alerta en Job #{job_id}: fallo en procesamiento ({error})."
            logger.warning(
                "[Observer:Notification] ALERTA: %s",
                message,
            )
            self._append_event(
                job_id=job_id,
                old_status=old_name,
                new_status=new_name,
                level="ERROR",
                message=message,
                brand_id=brand_id,
                timestamp=now_iso,
            )

    def _append_event(self, **event: Any) -> None:
        self.notifications.insert(0, event)
        if len(self.notifications) > self.MAX_HISTORY:
            self.notifications = self.notifications[: self.MAX_HISTORY]

    def get_notifications(self, brand_id: int | None = None) -> list[dict]:
        """Devuelve las notificaciones registradas, opcionalmente filtradas por marca."""
        if brand_id is None:
            return list(self.notifications)
        return [
            n for n in self.notifications
            if n.get("brand_id") in (None, brand_id)
        ]

    def clear_notifications(self) -> None:
        """Limpia el historial de notificaciones en memoria."""
        self.notifications.clear()


# ─── Subject Mixin ────────────────────────────────────────────────────────────

class JobSubjectMixin:
    """
    Mixin que convierte cualquier clase en un Subject Observable.
    Se aplica a ProcessingJob para darle comportamiento de Subject
    sin modificar los campos de la tabla ni el ORM de SQLAlchemy.
    """

    def __init_observables(self) -> None:
        """Lazy init de la lista de observers (compatible con ORM)."""
        if not hasattr(self, "_observers"):
            object.__setattr__(self, "_observers", [])

    def register_observer(self, observer: IJobObserver) -> None:
        """Registra un Observer. Idempotente: no añade duplicados."""
        self.__init_observables()
        if observer not in self._observers:
            self._observers.append(observer)

    def remove_observer(self, observer: IJobObserver) -> None:
        """Desregistra un Observer si existe."""
        self.__init_observables()
        if observer in self._observers:
            self._observers.remove(observer)

    def notify_observers(
        self,
        old_status: Any,
        new_status: Any,
        context: dict | None = None,
    ) -> None:
        """
        Notifica a todos los observers registrados con el modelo Push:
        les envía todos los datos relevantes directamente.
        """
        self.__init_observables()
        job_id = getattr(self, "id", 0) or 0
        for observer in list(self._observers):
            try:
                observer.update(job_id, old_status, new_status, context)
            except Exception as exc:  # noqa: BLE001
                # Un observer que falla no debe interrumpir el procesamiento
                logger.error("[Observer] Error en observer %s: %s", type(observer).__name__, exc)


# ─── Shared Observer Singletons (Live Telemetry & Feed) ──────────────────────

global_logging_observer = LoggingJobObserver()
global_stats_observer = StatsJobObserver()
global_notification_observer = NotificationJobObserver()
