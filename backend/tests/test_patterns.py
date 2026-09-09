"""
Tests para los patrones de diseño Decorator y Observer implementados en TryOnHub.

Cubre:
    - LoggingStrategyDecorator: delega correctamente al wrapped strategy.
    - CachingStrategyDecorator: retorna caché en segunda llamada con misma URL.
    - CachingStrategyDecorator: no comparte caché entre URLs distintas.
    - Cadena Decorator completa: Logging(Caching(Mock)).
    - LoggingJobObserver: recibe notificación con datos correctos.
    - StatsJobObserver: contadores se incrementan en READY y FAILED.
    - StatsJobObserver: no incrementa en transiciones intermedias.
    - JobSubjectMixin: register/remove observer.
    - JobSubjectMixin: observer que falla no rompe la notificación de otros.
"""
import pytest
from unittest.mock import MagicMock, patch
from app.services.ai_strategy import VirtualTryOnStrategy, MockTryOnStrategy
from app.services.strategy_decorators import (
    LoggingStrategyDecorator,
    CachingStrategyDecorator,
)
from app.services.job_observers import (
    IJobObserver,
    LoggingJobObserver,
    StatsJobObserver,
    JobSubjectMixin,
)
from app.domain.models.catalog import JobStatus


# ─── Fixtures ─────────────────────────────────────────────────────────────────

GARMENT_A = {
    "name": "Jean Skinny Test",
    "fit": "Skinny",
    "image_url": "http://example.com/jean_a.jpg",
}

GARMENT_B = {
    "name": "Jean Wide Test",
    "fit": "Wide Leg",
    "image_url": "http://example.com/jean_b.jpg",
}

GARMENT_A_DUPLICATE = {
    "name": "Jean Skinny Test v2",
    "fit": "Skinny",
    "image_url": "http://example.com/jean_a.jpg",  # Misma URL que GARMENT_A
}


# ─── Tests: Decorator — LoggingStrategyDecorator ──────────────────────────────

def test_logging_decorator_delegates_to_wrapped_strategy():
    """LoggingStrategyDecorator debe delegar al wrapped y retornar su resultado."""
    mock_strategy = MockTryOnStrategy()
    decorated = LoggingStrategyDecorator(mock_strategy)

    result = decorated.process_garment(GARMENT_A)

    assert "ai_generated_image_url" in result
    assert "metadata_json" in result


def test_logging_decorator_conforms_to_interface():
    """LoggingStrategyDecorator debe ser instancia de VirtualTryOnStrategy."""
    decorated = LoggingStrategyDecorator(MockTryOnStrategy())
    assert isinstance(decorated, VirtualTryOnStrategy)


def test_logging_decorator_calls_inner_exactly_once():
    """LoggingStrategyDecorator no llama al wrapped más de una vez por process_garment."""
    inner = MockTryOnStrategy()
    inner.process_garment = MagicMock(return_value={
        "ai_generated_image_url": "http://x.com/img.jpg",
        "metadata_json": {"source": "mock"},
    })
    decorated = LoggingStrategyDecorator(inner)

    decorated.process_garment(GARMENT_A)

    inner.process_garment.assert_called_once_with(GARMENT_A)


# ─── Tests: Decorator — CachingStrategyDecorator ──────────────────────────────

def test_caching_decorator_returns_cached_on_second_call():
    """La segunda llamada con la misma URL de imagen debe usar caché (no llama al inner)."""
    inner = MockTryOnStrategy()
    inner.process_garment = MagicMock(return_value={
        "ai_generated_image_url": "http://example.com/jean_a.jpg",
        "metadata_json": {"source": "mock", "fit_label": "Skinny"},
    })
    cached = CachingStrategyDecorator(inner)

    result_1 = cached.process_garment(GARMENT_A)
    result_2 = cached.process_garment(GARMENT_A_DUPLICATE)  # Misma URL

    assert inner.process_garment.call_count == 1, "El inner strategy debe llamarse una sola vez"
    assert cached.cache_size() == 1


def test_caching_decorator_different_urls_are_cached_separately():
    """Dos imágenes distintas deben generar dos entradas de caché separadas."""
    inner = MockTryOnStrategy()
    cached = CachingStrategyDecorator(inner)

    cached.process_garment(GARMENT_A)
    cached.process_garment(GARMENT_B)

    assert cached.cache_size() == 2


def test_caching_decorator_marks_cached_source():
    """El resultado cacheado debe tener source='cache' para trazabilidad."""
    inner = MockTryOnStrategy()
    cached = CachingStrategyDecorator(inner)

    cached.process_garment(GARMENT_A)
    result = cached.process_garment(GARMENT_A_DUPLICATE)  # Cache hit

    assert result["metadata_json"].get("source") == "cache"


def test_caching_decorator_clear_cache():
    """Después de clear_cache(), la siguiente llamada debe ir al inner."""
    inner = MockTryOnStrategy()
    inner.process_garment = MagicMock(return_value={
        "ai_generated_image_url": "http://example.com/jean_a.jpg",
        "metadata_json": {"source": "mock"},
    })
    cached = CachingStrategyDecorator(inner)

    cached.process_garment(GARMENT_A)  # Miss → llama inner
    cached.clear_cache()
    cached.process_garment(GARMENT_A)  # Miss nuevamente → llama inner otra vez

    assert inner.process_garment.call_count == 2


def test_full_decorator_chain_logging_caching_mock():
    """Cadena completa: Logging(Caching(Mock)) — funciona end-to-end."""
    strategy = LoggingStrategyDecorator(
        CachingStrategyDecorator(
            MockTryOnStrategy()
        )
    )
    result = strategy.process_garment(GARMENT_A)

    assert isinstance(result, dict)
    assert "ai_generated_image_url" in result
    assert "metadata_json" in result


# ─── Tests: Observer — LoggingJobObserver ─────────────────────────────────────

def test_logging_observer_receives_update():
    """LoggingJobObserver debe aceptar update() sin errores."""
    obs = LoggingJobObserver()
    obs.update(
        job_id=1,
        old_status=JobStatus.UPLOADED,
        new_status=JobStatus.PROCESSING,
    )  # No debe lanzar excepciones


def test_logging_observer_with_context():
    """LoggingJobObserver acepta contexto adicional."""
    obs = LoggingJobObserver()
    obs.update(
        job_id=5,
        old_status=JobStatus.PROCESSING,
        new_status=JobStatus.READY,
        context={"processed_items": 12},
    )


# ─── Tests: Observer — StatsJobObserver ───────────────────────────────────────

def test_stats_observer_increments_on_ready():
    """StatsJobObserver debe incrementar jobs_completed cuando new_status=READY."""
    obs = StatsJobObserver()
    obs.update(1, JobStatus.PROCESSING, JobStatus.READY, context={"processed_items": 5})

    assert obs.jobs_completed == 1
    assert obs.total_garments_processed == 5
    assert obs.jobs_failed == 0


def test_stats_observer_increments_on_failed():
    """StatsJobObserver debe incrementar jobs_failed cuando new_status=FAILED."""
    obs = StatsJobObserver()
    obs.update(2, JobStatus.PROCESSING, JobStatus.FAILED)

    assert obs.jobs_failed == 1
    assert obs.jobs_completed == 0


def test_stats_observer_no_increment_on_intermediate_state():
    """StatsJobObserver NO debe incrementar en transiciones intermedias (ej: UPLOADED→PROCESSING)."""
    obs = StatsJobObserver()
    obs.update(3, JobStatus.UPLOADED, JobStatus.PROCESSING)

    assert obs.jobs_completed == 0
    assert obs.jobs_failed == 0


def test_stats_observer_summary():
    """summary() retorna el estado acumulado correctamente."""
    obs = StatsJobObserver()
    obs.update(1, JobStatus.PROCESSING, JobStatus.READY, context={"processed_items": 10})
    obs.update(2, JobStatus.PROCESSING, JobStatus.FAILED)

    summary = obs.summary()
    assert summary["jobs_completed"] == 1
    assert summary["jobs_failed"] == 1
    assert summary["total_garments_processed"] == 10


# ─── Tests: Subject Mixin (JobSubjectMixin) ────────────────────────────────────

class _TestSubject(JobSubjectMixin):
    """Subject concreto mínimo para tests del mixin."""
    id = 99
    status = JobStatus.UPLOADED


def test_subject_mixin_register_and_notify():
    """Un observer registrado debe recibir notify_observers."""
    subject = _TestSubject()
    obs = MagicMock(spec=IJobObserver)

    subject.register_observer(obs)
    subject.notify_observers(JobStatus.UPLOADED, JobStatus.PROCESSING)

    obs.update.assert_called_once_with(
        99, JobStatus.UPLOADED, JobStatus.PROCESSING, None
    )


def test_subject_mixin_remove_observer():
    """Un observer removido no debe recibir notificaciones."""
    subject = _TestSubject()
    obs = MagicMock(spec=IJobObserver)

    subject.register_observer(obs)
    subject.remove_observer(obs)
    subject.notify_observers(JobStatus.UPLOADED, JobStatus.PROCESSING)

    obs.update.assert_not_called()


def test_subject_mixin_observer_error_does_not_break_others():
    """Si un observer lanza excepción, los siguientes deben seguir recibiendo la notificación."""
    subject = _TestSubject()

    bad_obs = MagicMock(spec=IJobObserver)
    bad_obs.update.side_effect = RuntimeError("Observer caído")
    good_obs = MagicMock(spec=IJobObserver)

    subject.register_observer(bad_obs)
    subject.register_observer(good_obs)
    subject.notify_observers(JobStatus.UPLOADED, JobStatus.PROCESSING)

    # good_obs debe haber recibido la notificación a pesar del error en bad_obs
    good_obs.update.assert_called_once()


def test_subject_mixin_no_duplicate_registration():
    """Registrar el mismo observer dos veces no debe generar duplicados."""
    subject = _TestSubject()
    obs = MagicMock(spec=IJobObserver)

    subject.register_observer(obs)
    subject.register_observer(obs)
    subject.notify_observers(JobStatus.UPLOADED, JobStatus.PROCESSING)

    assert obs.update.call_count == 1
