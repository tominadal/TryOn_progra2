"""
Tests for MockTryOnStrategy and Dependency Injection (USE_MOCK_AI).
"""
import pytest
from unittest.mock import MagicMock
from app.services.ai_strategy import (
    VirtualTryOnStrategy,
    MockTryOnStrategy,
    GeminiTryOnStrategy,
)
from app.services.strategy_decorators import (
    LoggingStrategyDecorator,
    CachingStrategyDecorator,
)
from app.dependencies import (
    get_base_tryon_strategy,
    get_tryon_strategy,
    get_garment_tryon_strategy,
)
from app.config.settings import settings


def test_mock_strategy_implements_interface():
    """MockTryOnStrategy must be an instance of VirtualTryOnStrategy."""
    strategy = MockTryOnStrategy()
    assert isinstance(strategy, VirtualTryOnStrategy)


def test_mock_strategy_returns_valid_static_dict():
    """
    process_garment must return synchronously a valid dictionary with static
    parametric descriptors including scale_x=1.0, fit_label='Regular', source='mock'.
    """
    strategy = MockTryOnStrategy()
    garment_data = {
        "Name": "Classic Denim",
        "Fit": "Regular",
        "Color": "Blue",
        "color_hex": "#1e3a8a",
    }
    result = strategy.process_garment(garment_data)

    assert "ai_generated_image_url" in result
    assert "metadata_json" in result

    meta = result["metadata_json"]
    assert meta["scale_x"] == 1.0
    assert meta["scale_y"] == 1.0
    assert meta["fit_label"] == "Regular"
    assert meta["source"] == "mock"
    assert meta["roughness"] == 0.82
    assert meta["waist_rise"] == 0.5
    assert meta["has_cuff"] is False
    assert meta["has_pleats"] is False


def test_mock_strategy_handles_missing_fields_gracefully():
    """process_garment must return valid defaults even when input data is empty."""
    strategy = MockTryOnStrategy()
    result = strategy.process_garment({})

    meta = result["metadata_json"]
    assert meta["scale_x"] == 1.0
    assert meta["fit_label"] == "Regular"
    assert meta["source"] == "mock"
    assert result["ai_generated_image_url"].startswith("https://mock-storage.com/")


def test_factory_returns_mock_when_use_mock_ai_is_true(monkeypatch):
    """When USE_MOCK_AI is True, get_base_tryon_strategy returns MockTryOnStrategy."""
    monkeypatch.setattr(settings, "USE_MOCK_AI", True)
    strategy = get_base_tryon_strategy()
    assert isinstance(strategy, MockTryOnStrategy)


def test_factory_returns_gemini_when_use_mock_ai_is_false(monkeypatch):
    """When USE_MOCK_AI is False, get_base_tryon_strategy returns GeminiTryOnStrategy."""
    monkeypatch.setattr(settings, "USE_MOCK_AI", False)
    strategy = get_base_tryon_strategy()
    assert isinstance(strategy, GeminiTryOnStrategy)


def test_get_tryon_strategy_with_decorators(monkeypatch):
    """get_tryon_strategy wraps strategy with Logging and optional Caching decorator."""
    monkeypatch.setattr(settings, "USE_MOCK_AI", True)

    # Without cache (dashboard)
    strat_no_cache = get_tryon_strategy(with_cache=False)
    assert isinstance(strat_no_cache, LoggingStrategyDecorator)
    assert isinstance(strat_no_cache._wrapped, MockTryOnStrategy)

    # With cache (excel processing)
    strat_cached = get_tryon_strategy(with_cache=True)
    assert isinstance(strat_cached, LoggingStrategyDecorator)
    assert isinstance(strat_cached._wrapped, CachingStrategyDecorator)
    assert isinstance(strat_cached._wrapped._wrapped, MockTryOnStrategy)


def test_mock_strategy_integrated_with_caching_decorator():
    """MockTryOnStrategy should work properly when wrapped in CachingStrategyDecorator."""
    inner = MockTryOnStrategy()
    cached = CachingStrategyDecorator(inner)

    item1 = {"image_url": "http://img.com/a.jpg", "Name": "A", "Fit": "Regular"}
    item2 = {"image_url": "http://img.com/a.jpg", "Name": "A copy", "Fit": "Regular"}

    res1 = cached.process_garment(item1)
    res2 = cached.process_garment(item2)

    assert res1["metadata_json"]["source"] == "mock"
    assert res2["metadata_json"]["source"] == "cache"
    assert cached.cache_size() == 1


def test_garment_dependency_provider(monkeypatch):
    """get_garment_tryon_strategy returns a LoggingStrategyDecorator over base."""
    monkeypatch.setattr(settings, "USE_MOCK_AI", True)
    strategy = get_garment_tryon_strategy()
    assert isinstance(strategy, LoggingStrategyDecorator)
    assert isinstance(strategy._wrapped, MockTryOnStrategy)
