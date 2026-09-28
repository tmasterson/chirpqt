"""Setup the main window for this application."""

# Copyright 2025 Tom masterson <kd7cyu@gmail.com>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import logging

from PySide6.QtGui import (
        QAction,
        QKeySequence,
)
from PySide6.QtWidgets import (
        QFileDialog,
        QMainWindow,
        QStatusBar,
)

from chirpQt.__version__ import version

logger = logging.getLogger(__name__)
logging.basicConfig(filename='chirpQt.log', encoding='utf-8',
                    level=logging.DEBUG)


class MainWindow(QMainWindow):
    """Chirp Qt main window."""

    version: str
    fileName: str

    def __init__(self):
        """Initialize our toplevel window."""
        super().__init__()
        self.version = version
        self.setWindowTitle(f'CHirpQt {self.version}')
        self.setStatusBar(QStatusBar(self))
        self.createMenu()
        logger.info('Window size %s', self.size())

    def createMenu(self):
        """Create the main menu."""
        fileOpenAction = QAction('&Open', self)
        fileOpenAction.setStatusTip('Open a file')
        fileOpenAction.triggered.connect(self.onFileOpenActionClick)
        fileOpenAction.setShortcut(QKeySequence('Ctrl+O'))
        quitAction = QAction('&Quit', self)
        quitAction.setStatusTip('Quit the application')
        quitAction.triggered.connect(self.onQuitActionClick)
        quitAction.setShortcut(QKeySequence('Ctrl+Q'))
        menubar = self.menuBar()
        file_menu = menubar.addMenu('&File')
        file_menu.addAction(fileOpenAction)
        file_menu.addAction(quitAction)
        edit_menu = menubar.addMenu('&Edit')
        radio_menu = menubar.addMenu('&Radio')

    def onFileOpenActionClick(self):
        """Open a file."""
        filter = 'Radio Files (*.img)'
        self.fileName = QFileDialog.getOpenFileName(self,
                                                    'Open Radio File', '',
                                                    filter)[0]

    def onQuitActionClick(self):
        """Quit the application."""
        self.close()
