import React from "react";
// Сама библиотека "Прослойка" для механизма websocket
import io from "socket.io-client";
// Ниже перечен стандартных Bootstrap компонентов
// Отображает список пользователей Онлайн
import Accordion from 'react-bootstrap/Accordion';
// Ну эт понятно
import Button from 'react-bootstrap/Button';
// Отображает сами сообщения
import Toast from 'react-bootstrap/Toast';
// Свой собственный стиль
import "./index.scss";
// Описание компонета, причем контейнерный
    // Более подробный механизм откомментирован на примере компонета App
class Room extends React.Component {
    constructor(props) {
        super(props);
        // ссылка на dom эл-т, для input куда вводим сообщение
        this.inputMessage = React.createRef();
        // ссылка на dom эл-т, области где отображаются все сообщения
            // нужно, для перемещения скролла вниз, при поступлении новых сообщений
        this.messagesArea = React.createRef();
        // Собственно, сам сокет, нацеленный на наш домен
            // Здесь мной описаны, некоторый дефольные св-ва
                // Можно было их не указывать, но опыт подсказывает иногда лучше не "умалчивать"
        this.socket = io({
            reconnection: true,
            reconnectionAttempts: Infinity,
            transports: ['websocket']
        });
        /**
         * Структура users
         * users:[{nickName: nickName, socketId: socket.id},...]
         * 
         * messages:[{
         *  nickName:nickName
         *  message:"",
         *  createdAt:new Date();
         *  socketId: socket.id
         * }]
         */
        // Начальное состояние компонета Room
        this.state = {
            users: [],
            messages: []
        }
        // Метод для отправки сообщения серверу
        this.sendMessage = this.sendMessage.bind(this);
    }
    // Метод, для проверки наличия сокета id юзера в текущем состоянии users с переданным сокетом id
    checkSocketId(id) {
        return this.state.users.findIndex((elm) => {
            return elm.socketId == id; // -1 если нет сокета
        })
    }
    // Метод, для получения ника по известному сокету id
    nickNameFromSocketId(id) {
        let index = this.checkSocketId(id)
        if (index != -1) {
            return this.state.users[index].nickName;
        }
        return null;
    }
    // lifeCircle - так называемый, срабатывает при внедрении/монтировании компонета в Dom
    componentDidMount() {
        // Событие при установке связи с сервером (websocket соединение)
        this.socket.on('connect', function () {
            /*
            * зависит от pathname url'a
                либо / => запрос id для new room
                либо /room/:id([0-9]+) => join socket to room id  
            */
            let pathname = window.location.pathname;
            // Ограничения для url
                // вида /room/ + числа в любом кол-ве
            let matchingArray = pathname.match(/^\/room\/([0-9]+)\/?$/i);
            // url - сам домен или любой другой, кроме "православного" matchingArray
            if (matchingArray == null) {
                //Событие серверу для создания комнаты (генерации ее id)
                this.socket.emit('new room');
                // Обработка входящеей id комнаты от сервера
                this.socket.on('id room', function (id) {
                    // Подменяем текущий url клиента на новый + переход на нее
                    window.location.assign("/room/" + id);
                })
            } else {
                // Клиент оброщается с url'ом удовлетворяющему формату комнаты ("^/room/[1-9]+$")
                let idRoom = matchingArray[1];
                // Событие на сервер, присоединить клиента в комнату
                this.socket.emit("join socket", idRoom, this.props.nickName);
            }
            // Обработка события от сервера, с проверкой кто на данный момент Онлайн
            this.socket.on("who is there", function () {
                // Уведомляем сервер
                this.socket.emit("i am here", this.props.nickName, this.socket.id)
            }.bind(this))

            //Удаление ушедшего пользователя!
            this.socket.on("user offline", function (socketId) {
                // Есть ли такой сокет в массиве users (массив в state находится)
                let userIndex = this.checkSocketId(socketId);
                // Клонируем текущнее состояние в обьект
                    // с целью взаимодействия с Копией, не с оригиалом
                let newState = Object.assign({}, this.state);
                if (userIndex !== -1) {
                    // Юзер найден - удалим его из массива users
                    newState.users.splice(userIndex, 1);
                }
                // Обновить состояние компонента
                return this.setState(newState);
            }.bind(this))

            //Добавляем пользователя в массив users который Онлайн!
            this.socket.on('user online', function (user) {
                let userIndex = this.checkSocketId(user.socketId);
                let newState = Object.assign({}, this.state);
                if (userIndex == -1) {
                    newState.users.push(user);
                }
                this.setState(newState);
            }.bind(this))
            this.socket.on('disconnect', function () {
                console.log("disconnection!");
            })

            // Получил новое сообщение от юзера в комнате
            this.socket.on("new message", function (message) {
                this.addMessage(message);
            }.bind(this))
            console.log("connection!");
        }.bind(this))
    }
    // метод, при каждом обновлении компонета срабатывает
    componentDidUpdate() {
        // Сдвиг скролла вниз в области сообщений
        this.scrollToBottom(this.messagesArea.current)
    }
    // Метод полезен, при работе с датой в формате миллисекунд приходящих от сервера
        // Посчитал затратным отправлять целый обьект типа Date => в итоге обмен литералом числа!
    fromNumberToDateType(dateNumber) {
        // дата от начала эпохи Unix
        let date = new Date(1970, 0, 1, 0, 0);
        // Плюс к ней некотроые кол-во милл.сек прошедших от этой даты
        date.setMilliseconds(dateNumber);
        // Возврат сам обьект типа Date с обновленной датой
        return date;
    }
    // Метод для добавления сообщений в массив messages который является частью state компонета
    addMessage(message) {
        // Клонируем состояние комнаты!
        let newState = Object.assign({}, this.state);
        // Если есть дата создания сообщения -> переводим к типу Date!
        if (message.createdAt) {
            message.createdAt = this.fromNumberToDateType(message.createdAt)
        } else {
            // В противном случае сегодняшнее ставим
            message.createdAt = new Date;
        }
        // Новое сообщение!
        newState.messages.push(message);
        // Обновление состояния!
        this.setState(newState);
    }
    sendMessage() {
        // Сам Dom элемент input, куда вводим сообщения
        let input = this.inputMessage.current;
        // Передадим  в качестве резерва еще nickName юзера, т.к
        // может быть ситуация поиск по soketId не даст рез-тов т.к юзер успел выйти!
        // а ник его нужно сохранить
        if (input.value) {
            // Уведомим сервер, что кто-то в комнате написал сообщение!
            this.socket.emit("send message", input.value, this.props.nickName);
            // После отправки - затираем/освобождаем поле для ввода нового сообщения!
            input.value = "";
        }
    }
    // Сам метод, для скролла вниз для любого переданного элемента
    scrollToBottom(elm) {
        elm.scrollTop = elm.scrollHeight;
        return null
    }
    render() {
        return (
            <div className="container room">
                <div className="row flex-column flex-md-row vh-100 flex-nowrap">
                    {/* ОБЛАСТЬ СПИСКА ЮЗЕРОВ КОМНАТЫ */}
                    <div className="col-md-3 room__area-users">
                        <Accordion defaultActiveKey="0">
                            <Accordion.Toggle as={Button} variant="outline-secondary" block eventKey="0">
                                Список участников &#9776;</Accordion.Toggle>
                            {this.state.users.map((user, id) => {
                                return (<Accordion.Collapse eventKey="0" key={id}>
                                    <div className="list-group-item room__list-item">{user.nickName}</div>
                                </Accordion.Collapse>)
                            })}
                        </Accordion>
                    </div>
                    {/* ОБЛАСТЬ ВСЕХ СООБЩЕНИЯ */}
                    <div className="col-md-9 room__area-messages">
                        <div ref={this.messagesArea} className="overflow-auto">
                            {this.state.messages.map((message, index) => {
                                let checkOnMyMessage = message.socketId == this.socket.id;
                                return (
                                    <div key={index} className="my-2">
                                        <div className={"d-flex " + (checkOnMyMessage ? "justify-content-end" : "")}>
                                            <Toast>
                                                <Toast.Header closeButton={false}>
                                                    <div className="mr-auto">
                                                        <strong>{this.nickNameFromSocketId(message.socketId) || message.nickName}</strong>
                                                        {checkOnMyMessage ? <small>(Это вы)</small> : null}
                                                    </div>
                                                    <small>{message.createdAt.toLocaleString()}</small>
                                                </Toast.Header>
                                                <Toast.Body>{message.message}</Toast.Body>
                                            </Toast>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="input-group">
                            <input onKeyPress={function (e) {
                                e.charCode == 13 ? this.sendMessage() : null;
                            }.bind(this)} type="text" className="form-control" ref={this.inputMessage} />
                            <div className="input-group-prepand">
                                <button onClick={this.sendMessage} className="btn btn-outline-secondary" type="button">Отправить</button>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        )
    }
}
export default Room;