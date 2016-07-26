// Define the module
var rtwApp = angular.module('rtwApp', []);

// Define the controller
rtwApp.controller('rtwAppCtrl', function ($scope, $timeout) {
    // 初始view model的資料與變數
    $scope.vm = {};
    $scope.vm.mqttStatus = "Disconnected";
    $scope.vm.disabled = true;
    $scope.action = {};
    $scope.receiveDivCss = {display: 'none'};
    $scope.sendDivCss = {display: 'none'};
    // Initialize mqtt connection
    var mqtt_client;
    var mqtt_broker_host;
    var mqtt_broker_port;
    var topic_subscribed = false;
    var topic;

        // ** 連接MQTT Broker
    $scope.action.connect_mqtt = function () {
        // 從UI取得mqtt broker的連接資訊
        mqtt_broker_host = mqttConfig.host;
        mqtt_broker_port = mqttConfig.port;

        // 產生mqtt連結client物件的instance
        mqtt_client = new Paho.MQTT.Client(mqtt_broker_host, Number(mqtt_broker_port), Math.uuid(8, 16));

        // 設定某些事件的回呼處理的functions
        mqtt_client.onConnectionLost = onConnectionLost;
        mqtt_client.onMessageArrived = onMessageArrived;
        // 連接mqtt broker
        mqtt_client.connect({ onSuccess: onConnect });

        // 當成功建立mqtt broker的連結時會被呼叫的function
        function onConnect() {
            $timeout(function(){
                $scope.vm.mqttStatus = "Connected";
                $scope.vm.disabled = false;
            });
            console.log("onConnect");
        }

        // 當與mqtt broker的連結被斷開時會被呼叫的function
        function onConnectionLost(responseObject) {
            if (responseObject.errorCode !== 0) {
                console.log("onConnectionLost:" + responseObject.errorMessage);
                $timeout(function(){
                    $scope.vm.mqttStatus = "Disconnected";
                });
            }
        }

        function onMessageArrived(message) {
            $scope.receiveDivCss = {display: 'block'};
            // 把訊息的主要資訊擷取出來
            //var topic = message.destinationName;
            var obj = JSON.parse(message.payloadString);
            console.log(obj.srcid);
            $timeout(function(){
                $scope.vm.receiveFrom = obj.srcid;
                $scope.vm.receiveMessage = obj.message;
            });
            // 打印到Browser的debug console
            console.log("onMessageArrived:" + message.payloadString);
        } 
    }
    $scope.action.register = function(message) {
        if (topic_subscribed == true) {
            // 要解除訂閱
            mqtt_client.unsubscribe(topic);
            topic = $scope.vm.id;
            mqtt_client.subscribe(topic);
        } else {
            // 要訂閱訊息主題
            topic = $scope.vm.id;
            mqtt_client.subscribe(topic);
            topic_subscribed = true; // 更新flag
        }
             
    }
    $scope.action.send_message = function () {
        $scope.sendDivCss = {display: 'block'};
        var message = '{ \"srcid\":\"'+$scope.vm.id+'\",\"message\":\"'+$scope.vm.message+'\"}';
        var mqtt_message = new Paho.MQTT.Message(message);
        mqtt_message.destinationName = $scope.vm.targetid;
        mqtt_client.send(mqtt_message);
        $timeout(function(){
            $scope.vm.sendMessage = $scope.vm.message;
            $scope.vm.sendTo = $scope.vm.targetid;
            $scope.vm.message = "";
            //any code in here will automatically have an apply run afterwards
        });

        //$scope.$apply();
    }
});
