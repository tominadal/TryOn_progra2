"""
Observer Pattern implementation for ProcessingJob status changes.

Observer Pattern (GoF) — igual al ejemplo de WeatherStation de Head First Design Patterns:
    El 'Subject' es ProcessingJob (a través del mixin JobSubjectMixin).
    Los 'ConcreteObservers' son LoggingJobObserver y StatsJobObserver.

Jerarquía:
    IJobObserver (ABC)              ← Observer abstracto
    ├── LoggingJobObserver          ← ConcreteObserver: audit trail de cambios de estado
    └── StatsJobObserver            ← ConcreteObserver: contadores en memoria

    JobSubjectMixin                 ← Mixin para agregar comportamiento Subject a ProcessingJob
        + register_observer(obs)
        + remove_observer(obs)
        + notify_observers(old_status, new_status, context)

Justificación de diseño (Oral Defense):
    Igual que WeatherData notifica a CurrentConditionsDisplay y StatisticsDisplay,
    ProcessingJob notifica a todos sus Observers cuando cambia de estado
    (UPLOADED → PROCESSING → READY / FAILED).
    El sistema de logging y el de estadísticas están DESACOPLADOS del procesamiento.
    Añadir un nuevo Observer (ej: SlackObserver, WebSocketObserver) requiere cero
    modificaciones en el Subject.

Modelo Push (como se enseña en clase):
    notify_observers empuja todos los datos relevantes a cada Observer.
    El Observer no necesita una referencia al Subject para consultar estado.

Uso en catalog.py (process_catalog_background):
    job = ProcessingJob(...)     # Ahora es también un Subject
    logging_obs = LoggingJobObserver()
    stats_obs = StatsJobObserver()
    job.register_observer(logging_obs)
    job.register_observer(stats_obs)

    # Al cambiar estado:
    old = job.status
    job.status = JobStatus.READY
    job.notify_observers(old_status=old, new_status=job.status)
    # → LoggingJobObserver.update() loguea el cambio
    # → StatsJobObserver.update() incrementa contador de jobs exitosos
"""
import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)


# ─── Observer (Interface) ────────────────────────────────────────────────────

class IJobObserver(ABC):
    """
    Interfaz abstracta Observer.
    Todo Observer concreto debe implementar update().

    Firma push: recibe todos los datos que necesita directamente,
    sin necesidad de consultar el Subject.
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
            context:    Información adicional opcional (ej: processed_items, error).
        """
        pass


# ─── Concrete Observers ──────────────────────────────────────────────────────

class LoggingJobObserver(IJobObserver):
    """
    ConcreteObserver que registra cada transición de estado del Job
    como un audit trail en el sistema de logging.

    Análogo a CurrentConditionsDisplay en la WeatherStation del libro:
    recibe datos del Subject y los presenta (en este caso, al log).
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

    Atributos:
        jobs_completed: Número de jobs que llegaron a estado READY.
        jobs_failed:    Número de jobs que llegaron a estado FAILED.
        total_garments_processed: Suma de prendas procesadas exitosamente.
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


# ─── Subject Mixin ────────────────────────────────────────────────────────────

class JobSubjectMixin:
    """
    Mixin que convierte cualquier clase en un Subject Observable.
    Se aplica a ProcessingJob para darle comportamiento de Subject
    sin modificar los campos de la tabla ni el ORM de SQLAlchemy.

    Principio de diseño: 'Program to interfaces, not implementations.'
    ProcessingJob hereda de JobSubjectMixin, ganando register/remove/notify.
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
