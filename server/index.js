const app = require('express')(),
    http = require('http').createServer(app),
    port = 80,
    path = require('path'),
    io = require('socket.io')(http);
/**
 * Route "files"
 */
app.get('/public/:file([\\w\\.]+)', function (req, res) {
    res.sendFile(req.params.file, {
        root: path.resolve("dist")
    }, function (err) {
        if (err) {
            res.status(404).end();
        }
    })
});
app.get('*', (req, res) => {
    res.sendFile('index.html', {
        root: path.resolve("public") //for security reasons
    })
});

io.on('connection', function (socket) {
    // Заранее определим структуру для сущности User (одним словом всё то, что мы под ним подразумеваем)
        // Подход интересный, но мне кажется чуть усложняет ситуацию (оставлю закоменченным, будет что с вами обсудить, если посчитаете мою работу подходящей.)
            // let declareUser = Object.preventExtensions(Object.defineProperties({}, {
            //     nickName: {
            //         writable: true,
            //         enumerable: true,
            //         configurable: false
            //     },
            //     socketId: {
            //         writable: true,
            //         enumerable: true,
            //         configurable: false
            //     }
            // }));

    // Создание комнаты, если клиент оброщается с url вида "/"
    socket.on('new room', function (nick) {
        // Генерация id комнаты
        let id_room = Math.floor(Math.random() * 10e10);
        // Отдаем клиенту id, чтобы он мог перейти на нее (отсюда получаем url комнаты как раз)
        socket.emit("id room", id_room);
    });
    
    // Добавляем нового участника в комнату, еслии клиент оброщается с url вида "/room/:id([0-9]+)"
    socket.on('join socket', function (idRoom, nickName) {
        // Сама "сцепка" клиента с комнатой
        socket.join(idRoom);

        // Кто здесь? Узнаем кто на связи/онлайн в комнате
        io.to(idRoom).emit("who is there");
        // Получаем информацию по всем активным участникам комнаты
        socket.on("i am here", function (nickName) {
            // Оповещаем Всех участников о том, кто на данный момент онлайн (т.е в комнате)
            io.in(idRoom).emit("user online", { nickName: nickName, socketId: socket.id })
        })

        // Сокет будет отключен, но пока он в rooms, также уведомляем всех участников, кроме его самого!
        socket.on('disconnecting', function (reason) {
            // Хотя у меня не реализован механизм "один сокет к многим комнатам" - эдакий мультиплексор!
                // Если бы был, думаю таких образом мы бы уведомляли все участников разных комнат - что кто-то offline!
            // Собственно получение списка комнат сокета
            let rooms = Object.keys(socket.rooms);
            // "Проходимся по всем и уведомляем!"
            rooms.forEach(function (room) {
                socket.to(room).emit("user offline", socket.id)
            })
        })

        // Получил сообщение - уведомлю комнату!
        socket.on('send message', function (message, nickName) {
            // Сообщения ориентируем по серверному времени
            // т.к время серверное - нам придется уведомить так же самого себя! (Для меня это ключевой момент)
            io.in(idRoom).emit("new message", {
                message: message,
                socketId: socket.id,
                nickName: nickName,
                createdAt: Date.now()
            })
        })
    })
    // Клиент отключился - выведем в лог сервера об этом
    socket.on('disconnect', (reason) => {
        console.log('user disconnected!');
    });
});

// Собственно сам сервер, его описание в аргументов + callback при запуске в ввиде вывода в консоль
http.listen({ port: port, host: 'localhost' }, () => console.log('Server work!'));