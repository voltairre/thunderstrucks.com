import QtQuick

Window {
	visible: true

	Image {
		source: "qrc:/qt/qml/thunderstruck/full_green_energy.jpg"
		asynchronous: true
		fillMode: Image.PreserveAspectCrop
		clip: true
		anchors.centerIn: parent
	}
}
