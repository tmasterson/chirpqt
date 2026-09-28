"""Tests for the @Memory class."""

# import logging

from chirpQt.utils.memory import Memory

# import pytest


def test_create_memory():
    """Test creation of a non-dv memory."""
    m1 = Memory(name='test1')
    assert isinstance(m1, Memory)
    assert m1.name == 'test1'
    assert not m1.dv_mem


def test_create_dv_memory():
    """Test creation of a dv memory."""
    m1 = Memory(name='test1', dv_mem=True)
    assert isinstance(m1, Memory)
    assert m1.name == 'test1'
    assert m1.dv_mem


def test_valid_setting():
    """Test if we can detect invalid setting."""
    m1 = Memory()
    assert not m1.valid_setting('tone', 11)
    m1.immutable.append('rtone')
    assert 'rtone' in m1.immutable
    assert not m1.valid_setting('rtone', 67.0)
    assert not m1.valid_setting('ctone', 11)
    assert not m1.valid_setting('duplex', '*')
