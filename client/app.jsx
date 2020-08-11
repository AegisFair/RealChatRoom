// Сама библиотека React
import React from "react";
// Ее независимая часть для работы с DOM
import ReactDom from "react-dom";
// Компонет для поле ввода "Ввода nickname"
import Enter from "./components/Enter/index.jsx";
// Компонент для представления комнаты
import Room from "./components/Room/index.jsx";
// стили Bootstrap (с возможностью перекомпиляции)
import "bootstrap/scss/bootstrap.scss";

// Главный компонент
class App extends React.Component {
    // Определение функции в роли "конструктор" (с внут.методом [[Construct]])
    constructor(prop) {
        // Вызов родительского конструктора т.е React.Component с передачей ему аргумента prop
            // в рез-те выполнения "super" к текущему "this" присваивается рез-т выполнения конструктора!
        super(prop);
        // Определение состония компонента App
            //Обеспечим возможность сохранение вводимого ранее nickname в лок.хранилище
                // что бы при смены комнат - сразу был переход в комнату (Хотя тоже спорно, есть свои + и -) 
        this.state = {
            nickName: window.localStorage.getItem("nickName") || null
        };
        // Метод, фигурирует в качестве Own св-в, не в прототипе
            // Когда будет вызов из Асинхронной очереди сообщений, нам нужно связка к текущему контексту this
        this.changeNickName = this.changeNickName.bind(this);
    }
    // Метод, реализует обновление состояния - т.е смену ника юзера
    changeNickName(newName) {
        this.setState({
            nickName: newName
        })
        // Сохраним его ник еще и в лок.хранилище => ник НЕ чувствителен к обновлению страницы
        localStorage.setItem("nickName", newName);
    }
    render() {
        let nickName = this.state.nickName;
        // В зависимости от наличия Ника юзера
            // Отображаем
                // или комнату
                // или поле для ввода ника
        return (
            nickName ? <Room nickName={nickName} /> : <Enter submit={this.changeNickName} />
        )




    }
}
// Само отображение в DOM (т.е его изменение)
ReactDom.render(
    <App />,//что отобразить
    window.document.getElementById("app")//куда отобразить
)