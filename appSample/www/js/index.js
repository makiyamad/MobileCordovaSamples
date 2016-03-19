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

var communicator = (function(){
    //objeto em memoria que armazena as mensagens salvas
    var savedMessages = [];
    //referencia a listview
    var messagesHtml = $('#messages');    

    var onSendMessage = function() {
        var message = {text: $('#message').val()};
        //inclui na lista de mensagens salvas
        savedMessages.push(message);
        //persiste na localStorage
        window.localStorage.setItem('messages', JSON.stringify(savedMessages));
        //atualiza a lista no html
        renderMessages();
    };

    var onDeleteMessages = function(){
        //apaga todas as mensagens da localStorage
        window.localStorage.clear();
        //limpa do objeto em memoria
        savedMessages = [];
        renderMessages();
    }

    var renderMessages = function(refresh){
        //se nao houver nenhuma mensagem renderiza 'no messages'
        if(savedMessages === []){
            $('#messages').html('<li>no messages</li>'); return;
        }

        //apaga o que foi gravado anteriormente na listview
        messagesHtml.html('');
        //itera sobre a lista de mensagens salvas
        savedMessages.forEach(function(msg){
            //cria um li para cada item da lista de mensagens
            messagesHtml.append('<li>' + msg.text + '</li>');
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
        }
    };

})();


app.initialize();
communicator.init();