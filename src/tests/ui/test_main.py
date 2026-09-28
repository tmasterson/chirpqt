"""Test main window functionality."""

import pytest


from PySide6.QtGui import (
        QAction,
)

from PySide6.QtWidgets import (
        QFileDialog,
        QMainWindow,
)
from chirpQt.qtui.qtmainwindow import MainWindow
@pytest.mark.skip(reason='Skipping for now requires having a gui environment.')
def test_file_button(qtbot, monkeypatch):
    window = MainWindow()
    window.show()
    qtbot.addWidget(window)
    monkeypatch.setattr(QFileDialog, 'getOpenFileName', lambda *args: ('test.img', 'img'))
    for action in window.findChildren(QAction):
        if action.text() == '&Open':
            action.trigger()
    assert window.fileName == 'test.img'
