"""Calculadora IPv4 e Subnetting, sem dependências de execução."""
__version__ = "1.0.0"
from .core import calculate, validate_ip, validate_prefix
__all__ = ["calculate", "validate_ip", "validate_prefix"]
