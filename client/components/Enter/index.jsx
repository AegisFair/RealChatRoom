import React from "react";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import "./index.scss";

function Enter(props) {
    // Двойное экранирование - из-за различий в управляющих последовательностях RegExp и String
        // В последствии эта строка переводится в RegExp
    const pattern = "^[^\\s][\\w\\s\\u0400-\\u04ff]{1,15}$";
    function handlerSubmit(e) {
        e.preventDefault();
        let nick = e.target.querySelector(".nickName").value;
        // Ограничение накладываемые на nickname
            //длина до 15символов
            // первый символ не пробел
            // поддерживаем кириллицу
        if (!nick.match(pattern)) return e.target.reportValidity();
        props.submit(nick);
    }
    return (
        <div className="enter">
            <div className="col-md-4">
                <h1>Добро пожаловать в RealChatRoom!</h1>
                <Form onSubmit={handlerSubmit}>
                    <Form.Group controlId="formGroupEmail">
                        <Form.Label>Введите ваш Nickname:</Form.Label>
                        <Form.Control required className="nickName" type="text" pattern={pattern} />
                        <Form.Text id="passwordHelpBlock" muted>
                            Цифро-буквенное содержание до 15 символов!
                        </Form.Text>
                    </Form.Group>
                    <Form.Group controlId="formGroupPassword">
                        <Button variant="outline-success" type="submit">
                            Enter
                        </Button>
                    </Form.Group>
                </Form>
            </div>
        </div>
    )
}
export default Enter;