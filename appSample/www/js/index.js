/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    //add listener to mobileinit event
    bindEvents: function() {
        $(document).on("mobileinit", this.onMobileInit);
    },
    // Update DOM on a Received Event
    onMobileInit: function() {
        $.mobile.defaultPageTransition = "none";
        $.mobile.defaultDialogTransition = "none";
    }
};

var html = {
    li: function(txt){
        return "<li>" + txt + "</li>";
    },
    img: function(src, alt, cls, clsContainer){
        return "<div class='" + clsContainer + "'><img alt='" + alt + "' src='" + src + "' class='" + cls + "' /></div>";
    },

}

var accelerometer = (function(){

    var transforms = ['-webkit-transform', '-moz-transform', '-ms-transform', 'transform'];

    var accelerometerSuccess = function(data){

        var rotate = {};
        transforms.forEach(function(attr){

            var rotateX = 'rotateX(' + (data.x*100) + 'deg)';
            var rotateY = 'rotateY(' + (data.y*100) + 'deg)';
            var rotateZ = 'rotateZ(' + (data.z*100) + 'deg)';

            rotate[attr] =  rotateX + rotateY + rotateZ;
        })

        $('#box-phone-d1').css(rotate);
    }

    var accelerometerError = function(err){
        console.log('could not access acelerator ' + err)
    }    

    return {
        init: function(){
            var options = {frequency : 2000};
            navigator.accelerometer
                .watchAcceleration(
                    accelerometerSuccess, 
                    accelerometerError, 
                    options);
        }
    };
})();

var socketClient = (function(){

    var socket = null;
    var connected = false;

    var onSocketError = function(error) {
        console.log('WebSocket Error: ' + error);
    };

    var onSocketOpen = function(event) {
        console.log('Connected to: ws://echo.websocket.org');
        connected = true;
    };

    var onSocketMessage = function(event) {
        var message = event.data;
        console.log('Received: ' + message);
    };

    var onSocketClose = function(event) {
        console.log('Disconnected');
    };

    return {
        init: function(){
            socket = new WebSocket('ws://echo.websocket.org');
            socket.onmessage = onSocketMessage;
            socket.onerror = onSocketError;
            socket.onopen = onSocketOpen;
            socket.onclose = onSocketClose;
        },
        sendMessage : function(message){
            if(socket && connected)
                socket.send(message);
        }        
    };

})();


var userData = (function(){
    var myKey = 'a';
    var usersList = [];

    var onGetUserListSuccess = function(data){
        usersList = data;
        var usersHtml = $('#users');

        usersList.forEach(function(u){
            var item = html.li('<a href="#page"><div class="square"><img id="box-phone-' 
                + u.user + '" src="img/phone.png" /></div>&nbsp;Dupla ' 
                + u.user + '</a>');

            usersHtml.append(item);
        });

        usersHtml.listview('refresh');
    }

    var getUserList = function(){

        $.ajax({
          dataType: 'jsonp',
          jsonpCallback: 'jsonCallback',
          contentType: 'application/json',
          url: 'http://donuts4u3.servicos.ws/fei/alunos.txt',
          success: onGetUserListSuccess
        });

    }

    return {
        myKey : 'a',
        init : function(){
            getUserList();
        }
    }

})();

var communicator = (function(){
    //objeto em memoria que armazena as mensagens salvas
    var savedMessages = [];
    //referencia a listview
    var messagesHtml = $('#messages');

    var storeMessage = function(type, val){
        var message = {value: val, type: type};
        //inclui na lista de mensagens salvas
        savedMessages.push(message);
        //persiste na localStorage
        window.localStorage.setItem('messages', JSON.stringify(savedMessages));
    }

    var onGetPhoto = function(){

        var options = { 
                sourceType : Camera.PictureSourceType.PHOTOLIBRARY, 
                destinationType : Camera.DestinationType.DATA_URL            
            //    sourceType : Camera.PictureSourceType.CAMERA, 
            //    destinationType : Camera.DestinationType.DATA_URL 
            };

        navigator.camera.getPicture(onGetPhotoSuccess, onGetPhotoError, options);
    }

    var onGetPhotoSuccess = function(imageData){        
        storeMessage('image64', imageData);
        renderMessages(true);
    }

    var onGetPhotoError = function(err){
        console.log('could not access photos ' + err);
    }    

    var onSendMessage = function() {
        storeMessage('text', $('#message').val());
        //envia mensagem para outros clientes
        socketClient.sendMessage($('#message').val());        
        //limpa o textarea
        $('#message').val('');
        //atualiza a lista no html
        renderMessages(true);
    };

    var onDeleteMessages = function(){
        //apaga todas as mensagens da localStorage
        window.localStorage.clear();
        //limpa do objeto em memoria
        savedMessages = [];
        renderMessages(true);
    }

    var renderMessages = function(refresh){
        //se nao houver nenhuma mensagem renderiza 'no messages'
        if(savedMessages === []){
            $('#messages').html(html.li('no messages')); return;
        }

        //apaga o que foi gravado anteriormente na listview
        messagesHtml.html('');
        //itera sobre a lista de mensagens salvas
        savedMessages.forEach(function(msg){
            //cria um li para cada item da lista de mensagens
            if(msg.type === 'text') {messagesHtml.append(html.li(msg.value));}
            if(msg.type === 'image64'){
                var src = "data:image/jpeg;base64," + msg.value;
                messagesHtml.append(html.li(html.img(src, 'image','img-thumb', 'img-container')));
            }
            //caso já exista uma listview criada, executa o comando de refresh
            // para aplicar o estilo novamente apos recriar a lista
            if(refresh) messagesHtml.listview('refresh');
        });
    }

    return {
        init: function(){
            //busca as mensagens salvas em localStorage
            var messages = window.localStorage.getItem('messages');
            //converte as mensagens de string para array javascript
            if(messages) savedMessages = JSON.parse(messages);
            //rendiza as mensagens do array de savedMessages
            renderMessages();
            //registra os eventos de touch no botao de send-message e delete-messages
            $('#send-message').on("tap", onSendMessage);            
            $('#delete-messages').on("tap", onDeleteMessages);
            $('#get-photo').on("taphold", onGetPhoto);
        }
    };

})();


app.initialize();
communicator.init();
accelerometer.init();
socketClient.init();
userData.init();