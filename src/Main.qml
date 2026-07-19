import QtQuick
import QtQuick.Shapes

Window {
    visible: true

    Image {
        source: "qrc:/qt/qml/thunderstruck/assets/blur_full_green_energy.jpg"
        asynchronous: true
        fillMode: Image.PreserveAspectCrop
        clip: true
        anchors.centerIn: parent
        anchors.fill: parent

        CoatOfArms {
            anchors.centerIn: parent
            scale: 2.0
        }
    }
}
