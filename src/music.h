#pragma once

#include <QObject>
#include <QQmlEngine>

class Music : public QObject {
  Q_OBJECT
  QML_ELEMENT

 public:
  explicit Music(QObject *parent = nullptr);

 signals:

};
