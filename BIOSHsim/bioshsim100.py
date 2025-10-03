import sys
from pathlib import Path
from PyQt6.QtCore import Qt, QPoint, QUrl
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel
)
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEnginePage


class SingleSiteBrowser(QMainWindow):
    def __init__(self, start_url: str, app_title: str):
        super().__init__()
        self.setWindowTitle(app_title)
        self.setMinimumSize(900, 600)

        self.webview = QWebEngineView()

        page = QWebEnginePage(self)
        self.webview.setPage(page)

        self.webview.setUrl(QUrl(start_url))
        self.setCentralWidget(self.webview)


def main():
    app = QApplication(sys.argv)
    window = SingleSiteBrowser("https://bioshsim.pages.dev/", "BIOSHsim1.0.0")
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()