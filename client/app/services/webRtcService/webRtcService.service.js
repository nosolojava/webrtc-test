'use strict';

angular.module('webrtcTestApp')
  .service('$webRtcService', function ($rootScope,$window,$log,$http) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    /*
     * TeleStax, Open Source Cloud Communications
     * Copyright 2011-2015, Telestax Inc and individual contributors
     * by the @authors tag.
     *
     * This program is free software: you can redistribute it and/or modify
     * under the terms of the GNU Affero General Public License as
     * published by the Free Software Foundation; either version 3 of
     * the License, or (at your option) any later version.
     *
     * This program is distributed in the hope that it will be useful,
     * but WITHOUT ANY WARRANTY; without even the implied warranty of
     * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     * GNU Affero General Public License for more details.
     *
     * You should have received a copy of the GNU Affero General Public License
     * along with this program.  If not, see <http://www.gnu.org/licenses/>
     */

    /**
     * Class TelScaleWebRTCPhoneController
     * @public 
     */ 

    //fix to inject webrtc js into angular --> in WebRTComm.js this function is registered in window object!!
    var WebRTCommClient=window.WebRTCommClient;


    navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL;
    /**
     * Constructor 
     */ 
    function TelScaleWebRTCPhoneController() {
        console.debug('TelScaleWebRTCPhoneController:TelScaleWebRTCPhoneController()');
        //  WebRTComm client 
        this.webRTCommClient = new WebRTCommClient(this); 
        this.webRTCommClientConfiguration=undefined;
        this.localAudioVideoMediaStream=undefined;
        this.webRTCommActiveCalls=new Map();
        this.webRTCommCall=undefined;
        this.sipContact=TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_CONTACT;
        this.arrayToStoreChunks = [];
        this.audio = false;
        this.video=false;
        $rootScope.iceServers = undefined;
    }

    TelScaleWebRTCPhoneController.prototype.constructor=TelScaleWebRTCPhoneController;

    // Default SIP profile to use
    TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_OUTBOUND_PROXY='ws://' + window.location.hostname + ':5082';
    TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_USER_AGENT='TelScale WebRTC Client Example';
    TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_USER_AGENT_CAPABILITIES=undefined;
    TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_DOMAIN='telestax.com';
    TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_DISPLAY_NAME='alice';
    TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_USER_NAME='alice';
    TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_LOGIN='';
    TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_PASSWORD='';
    TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_CONTACT='bob';
    TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_REGISTER_MODE=true;
    //TelScaleWebRTCPhoneController.prototype.DEFAULT_STUN_SERVER='undefined'; // stun.l.google.com:19302
    TelScaleWebRTCPhoneController.prototype.DEFAULT_ICE_SERVERS=undefined;
    TelScaleWebRTCPhoneController.prototype.DEFAULT_STUN_SERVER='stun.l.google.com:19302'; 
    TelScaleWebRTCPhoneController.prototype.DEFAULT_TURN_SERVER='turn2.xirsys.com:443?transport=tcp';
    TelScaleWebRTCPhoneController.prototype.DEFAULT_TURN_LOGIN='22d6e7ba-5a0e-4674-9762-caafe43c1df2'; 
    TelScaleWebRTCPhoneController.prototype.DEFAULT_TURN_PASSWORD='5119438d-0f3e-4a01-8b22-e88dbf3f49ef'; 
    TelScaleWebRTCPhoneController.prototype.DEFAULT_AUDIO_CODECS_FILTER=undefined; // RTCPeerConnection default codec filter
    TelScaleWebRTCPhoneController.prototype.DEFAULT_VIDEO_CODECS_FILTER=undefined; // RTCPeerConnection default codec filter
    TelScaleWebRTCPhoneController.prototype.DEFAULT_LOCAL_VIDEO_FORMAT='{\'mandatory\': {\'maxWidth\': 500}}';
    TelScaleWebRTCPhoneController.prototype.DEFAULT_SIP_URI_CONTACT_PARAMETERS=undefined;
    TelScaleWebRTCPhoneController.prototype.DEFAULT_DTLS_SRTP_KEY_AGREEMENT_MODE=true;
    TelScaleWebRTCPhoneController.prototype.DEFAULT_FORCE_TURN_MEDIA_RELAY_MODE=false;
    TelScaleWebRTCPhoneController.prototype.XIRSYS_URL='https://service.xirsys.com/ice'; 
    TelScaleWebRTCPhoneController.prototype.XIRSYS_LOGIN='jaimehomer'; 
    TelScaleWebRTCPhoneController.prototype.XIRSYS_PASSWORD='6932092e-1a54-11e5-955c-c0b182264791'; 
    TelScaleWebRTCPhoneController.prototype.XIRSYS_DOMAIN='playmybandnow.ddns.net'; 
    TelScaleWebRTCPhoneController.prototype.XIRSYS_APP='playmyband'; 
    TelScaleWebRTCPhoneController.prototype.XIRSYS_ROOM='default';    

    TelScaleWebRTCPhoneController.prototype.retrieveIceServers=function()
    {
        var postData = {
                  domain: $rootScope.pMBtelScaleWebRTCPhoneController.XIRSYS_DOMAIN,
                  room: $rootScope.pMBtelScaleWebRTCPhoneController.XIRSYS_ROOM,
                  application: $rootScope.pMBtelScaleWebRTCPhoneController.XIRSYS_APP,
                  ident: $rootScope.pMBtelScaleWebRTCPhoneController.XIRSYS_LOGIN,
                  secret: $rootScope.pMBtelScaleWebRTCPhoneController.XIRSYS_PASSWORD,
                  secure: '1'
                };
        var postReq = {
            method :'POST',
            url:$rootScope.pMBtelScaleWebRTCPhoneController.XIRSYS_URL,
            data: postData,
            headers : {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}                
        };        
        $http(postReq).
          success(function(data, status, headers, config) {
            $log.debug('IceServers set to...', data, status,headers, config);            
            $rootScope.iceServers = data.d.iceServers;
            $rootScope.pMBtelScaleWebRTCPhoneController.webRTCommClient.configuration.RTCPeerConnection.iceServers = data.d.iceServers; 
            $rootScope.$broadcast('playmyband.webrtc.iceservers.retrieved',data);
          }).
          error(function(data, status, headers, config) {
            $log.debug('error getting iceServers', data, status, headers, config);
            $rootScope.iceServers = undefined;
            $rootScope.pMBtelScaleWebRTCPhoneController.webRTCommClient.configuration.RTCPeerConnection.iceServers = undefined;
            $rootScope.$broadcast('playmyband.webrtc.iceservers.error',data);
          }); 
    };

    /**
     * on connect event handler
     */ 
    TelScaleWebRTCPhoneController.prototype.register=function(sipUserName)
    {
        console.debug ('TelScaleWebRTCPhoneController:onClickRegister()');

        if(this.webRTCommClientConfiguration === undefined) {
          // Setup SIP default Profile
          this.webRTCommClientConfiguration =  { 
              communicationMode:WebRTCommClient.prototype.SIP,
              sip:{
                  sipUserAgent:this.DEFAULT_SIP_USER_AGENT,
                  sipOutboundProxy:this.DEFAULT_SIP_OUTBOUND_PROXY,
                  sipDomain:this.DEFAULT_SIP_DOMAIN,
                  sipDisplayName:this.DEFAULT_SIP_DISPLAY_NAME,
                  sipUserName:this.DEFAULT_SIP_USER_NAME,
                  sipLogin:this.DEFAULT_SIP_LOGIN,
                  sipPassword:this.DEFAULT_SIP_PASSWORD,
                  sipUriContactParameters:this.DEFAULT_SIP_URI_CONTACT_PARAMETERS,
                  sipUserAgentCapabilities:this.DEFAULT_SIP_USER_AGENT_CAPABILITIES,
                  sipRegisterMode:this.DEFAULT_SIP_REGISTER_MODE
              },
              RTCPeerConnection:
              {
                  iceServers:$rootScope.iceServers,
                  stunServer:this.DEFAULT_STUN_SERVER,
                  turnServer:this.DEFAULT_TURN_SERVER, 
                  turnLogin:this.DEFAULT_TURN_LOGIN,
                  turnPassword:this.DEFAULT_TURN_PASSWORD,
                  dtlsSrtpKeyAgreement:this.DEFAULT_DTLS_SRTP_KEY_AGREEMENT_MODE,
                  forceTurnMediaRelay:this.DEFAULT_FORCE_TURN_MEDIA_RELAY_MODE
              }
          }; 
      }
        if(this.webRTCommClient !== undefined)
        {
          //by jimsipUserName = document.getElementById('sipUserName').value;
            this.webRTCommClientConfiguration.sip.sipDisplayName= sipUserName;
            this.webRTCommClientConfiguration.sip.sipUserName = sipUserName;
          try {
              this.webRTCommClient.open(this.webRTCommClientConfiguration); 
              console.info('TelScaleWebRTCPhoneController:onClickRegister(): client opened');      
            }
            catch(exception)
            {
                console.error('Connection has failed, reason:'+exception);
            }
        }
        else
        {
            console.error('TelScaleWebRTCPhoneController:onClickRegister(): internal error');      
        }
    };

    /**
     * on disconnect event handler
     */ 
    TelScaleWebRTCPhoneController.prototype.unregister=function()
    {
        console.debug ('TelScaleWebRTCPhoneController:onClickUnregister()'); 
        if(this.webRTCommClient !== undefined)
        {
            try
            {
                this.webRTCommClient.close();
                this.webRTCommClientConfiguration = undefined;
            }
            catch(exception)
            {
                console.error('Disconnection has failed, reason:'+exception);
            }
        }
        else
        {
            console.error('TelScaleWebRTCPhoneController:onClickUnregister(): internal error');      
        }
    };

    /**
      * Implementation of the WebRtcCommClient listener interface
      */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommClientOpenedEvent=function()
    {
        console.debug ('TelScaleWebRTCPhoneController:onWebRTCommClientOpenedEvent()');
        $rootScope.$broadcast('playmyband.webrtc.client.opened');
    };
        
    TelScaleWebRTCPhoneController.prototype.onWebRTCommClientOpenErrorEvent=function(error)
    {
        console.debug ('TelScaleWebRTCPhoneController:onWebRTCommClientOpenErrorEvent():error:'+error);
        $rootScope.$broadcast('playmyband.webrtc.client.openError'); 
        this.webRTCommCall=undefined;
        console.error('Connection to the Server has failed'); 
    }; 
        
    /**
     * Implementation of the WebRtcCommClient listener interface
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommClientClosedEvent=function()
    {
        console.debug ('TelScaleWebRTCPhoneController:onWebRTCommClientClosedEvent()');
        $rootScope.$broadcast('playmyband.webrtc.client.closed'); 
        this.webRTCommCall=undefined;
    };

    TelScaleWebRTCPhoneController.prototype.getLocalUserMedia=function(videoContraints){
        console.debug ('TelScaleWebRTCPhoneController:getLocalUserMedia():videoContraints='+JSON.stringify(videoContraints));  
        var that = this;
        if(navigator.getMedia)
        {
            navigator.getMedia({
                audio:that.audio, 
                video: that.audio,
            }, function(localMediaStream) {
                that.onGetUserMediaSuccessEventHandler(localMediaStream);
            }, function(error) {
                that.onGetUserMediaErrorEventHandler(error);
            });
        }
        else
        {
            console.error('TelScaleWebRTCPhoneController:onLoadEventHandler(): navigator doesn\'t implemement getUserMedia API');
        }
    };  
        
    /**
     * get user media success event handler (Google Chrome User agent)
     * @param localAudioVideoMediaStream object
     */ 
    TelScaleWebRTCPhoneController.prototype.onGetUserMediaSuccessEventHandler=function(localAudioVideoMediaStream) 
    {
        $rootScope.$broadcast('playmyband.webrtc.usermedia.sucess',localAudioVideoMediaStream);     
        try
        {
            console.debug('TelScaleWebRTCPhoneController:onGetUserMediaSuccessEventHandler(): localAudioVideoMediaStream.id='+localAudioVideoMediaStream.id);
            this.localAudioVideoMediaStream=localAudioVideoMediaStream;
        }
        catch(exception)
        {
            console.debug('TelScaleWebRTCPhoneController:onGetUserMediaSuccessEventHandler(): catched exception: '+exception);
        }
    };           
     
    TelScaleWebRTCPhoneController.prototype.onGetUserMediaErrorEventHandler=function(error) 
    {
        console.debug('TelScaleWebRTCPhoneController:onGetUserMediaErrorEventHandler(): error='+error);
        $rootScope.$broadcast('playmyband.webrtc.usermedia.error',error);    
    };  

    /**
     * on call event handler
     */ 
    TelScaleWebRTCPhoneController.prototype.call=function(contact)
    {
        console.debug ('TelScaleWebRTCPhoneController:onClickCall()');     
        try
        {
            var callConfiguration = {
                displayName:this.DEFAULT_SIP_DISPLAY_NAME,
                localMediaStream: this.localAudioVideoMediaStream,
                audioMediaFlag:this.audio,
                videoMediaFlag:this.video,
                messageMediaFlag:true,
                audioCodecsFilter:null,
                videoCodecsFilter:null
            };
            this.webRTCommCall = this.webRTCommClient.call(contact, callConfiguration);
        }
        catch(exception)
        {
            console.error('Call has failed, reason:'+exception);
        }
    };

    /**
     * on call event handler
     */ 
    TelScaleWebRTCPhoneController.prototype.cancel=function()
    {
        console.debug ('TelScaleWebRTCPhoneController:onClickCancelCall()'); 
        if(this.webRTCommCall !== undefined)
        {
            try
            {
                this.webRTCommCall.close();
            }
            catch(exception)
            {
                console.error('TelScaleWebRTCPhoneController:onClickCancelCall(): catched exception:'+exception);
            }
        }
        else
        {
            console.error('TelScaleWebRTCPhoneController:onClickCancelCall(): internal error');      
        }
    };

    /**
     * on call event handler
     */ 
    TelScaleWebRTCPhoneController.prototype.disconnectCall=function()
    {
        console.debug ('TelScaleWebRTCPhoneController:onClickDisconnectCall()'); 
        if(this.webRTCommCall)
        {
            try
            {
                this.webRTCommCall.close();            
            }
            catch(exception)
            {
                console.error('End has failed, reason:'+exception); 
            }
        }
        else
        {
            console.error('TelScaleWebRTCPhoneController:onClickDisconnectCall(): call is already closed');      
        }
    };

    /**
     * on accept event handler
     */ 
    TelScaleWebRTCPhoneController.prototype.acceptCall=function()
    {
        console.debug ('TelScaleWebRTCPhoneController:onClickAcceptCall()'); 
        if(this.webRTCommCall)
        {
            try
            {
                var callConfiguration = {
                    displayName:this.webRTCommClientConfiguration.sip.sipDisplayName,
                    localMediaStream: this.localAudioVideoMediaStream,
                    audioMediaFlag:this.audio,
                    videoMediaFlag:this.video,
                    messageMediaFlag:true
                };
                this.webRTCommCall.accept(callConfiguration);            
            }
            catch(exception)
            {
                console.error('End has failed, reason:'+exception); 
            }
        }
        else
        {
            console.error('TelScaleWebRTCPhoneController:onClickAcceptCall(): internal error');      
        }
    };

    /**
     * on accept event handler
     */ 
    TelScaleWebRTCPhoneController.prototype.rejectCall=function()
    {
        console.debug ('TelScaleWebRTCPhoneController:onClickRejectCall()'); 
      if(this.webRTCommCall)
        {
            try
            {
                this.webRTCommCall.reject();
                this.webRTCommCall = undefined;
            }
            catch(exception)
            {
                console.error('End has failed, reason:'+exception);
            }
        }
        else
        {
            console.error('TelScaleWebRTCPhoneController:onClickRejectCall(): internal error');      
        }
    };

    /**
     * Implementation of the webRTCommCall listener interface
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommCallClosedEvent=function(webRTCommCall)
    {
        console.debug ('TelScaleWebRTCPhoneController:onWebRTCommCallClosedEvent(): webRTCommCall.getId()='+webRTCommCall.getId());
        this.webRTCommCall=undefined;

      var from = null;
      if (webRTCommCall.isIncoming()) {
                from = webRTCommCall.getCallerPhoneNumber();
            } else {
                from = webRTCommCall.getCalleePhoneNumber();
            }
        this.webRTCommActiveCalls.delete(from);
        this.webRTCommCall=undefined;
        $rootScope.$broadcast('playmyband.webrtc.call.closed',webRTCommCall);
    };
       
       
    /**
     * Implementation of the webRTCommCall listener interface
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommCallOpenedEvent=function(webRTCommCall)
    {
        console.debug ('TelScaleWebRTCPhoneController:onWebRTCommCallOpenedEvent(): webRTCommCall.getId()='+webRTCommCall.getId()); 
      var from = null;
      if (webRTCommCall.isIncoming()) {
                from = webRTCommCall.getCallerPhoneNumber();
            } else {
                from = webRTCommCall.getCalleePhoneNumber();
            }
        this.webRTCommActiveCalls.set(from, webRTCommCall);
        $rootScope.$broadcast('playmyband.webrtc.call.opened',webRTCommCall);    
    };

    /**
     * Implementation of the webRTCommCall listener interface
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommCallInProgressEvent=function(webRTCommCall)
    {
        console.debug ('TelScaleWebRTCPhoneController:onWebRTCommCallInProgressEvent(): webRTCommCall.getId()='+webRTCommCall.getId());
        $rootScope.$broadcast('playmyband.webrtc.call.inprogress',webRTCommCall);
    };


    /**
     * Implementation of the webRTCommCall listener interface
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommCallOpenErrorEvent=function(webRTCommCall, error)
    {
        console.debug ('TelScaleWebRTCPhoneController:onWebRTCommCallOpenErrorEvent(): webRTCommCall.getId()='+webRTCommCall.getId(),error);
        this.webRTCommCall=undefined;
        $rootScope.$broadcast('playmyband.webrtc.call.openerror',webRTCommCall);
    };

    /**
     * Implementation of the webRTCommCall listener interface
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommCallRingingEvent=function(webRTCommCall)
    {
        console.debug ('TelScaleWebRTCPhoneController:onWebRTCommCallRingingEvent(): webRTCommCall.getId()='+webRTCommCall.getId());
        this.webRTCommCall=webRTCommCall;
        $rootScope.$broadcast('playmyband.webrtc.call.ringing',webRTCommCall);     
    };

    /**
     * Implementation of the webRTCommCall listener interface
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommCallRingingBackEvent=function(webRTCommCall)
    {
        console.debug ('TelScaleWebRTCPhoneController:onWebRTCommCallRingingBackEvent(): webRTCommCall.getId()='+webRTCommCall.getId());
        $rootScope.$broadcast('playmyband.webrtc.call.ringingback',webRTCommCall);
    };

    /**
     * Implementation of the WebRTCommCall listener interface
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommCallHangupEvent=function(webRTCommCall)
    {
        $rootScope.$broadcast('playmyband.webrtc.call.hangup',webRTCommCall);      
        this.webRTCommCall=undefined;
    };



    /**
     * on send message event handler
     */ 
    TelScaleWebRTCPhoneController.prototype.sendMessage=function(contact,message)
    {
        console.debug ('WebRTCommTestWebAppController:onClickSendMessage()'); 

        //this.webRTCommActiveCalls.forEach(function (activeCall, contact) { // NOT USED
        this.webRTCommActiveCalls.forEach(function (activeCall) {
      if(activeCall && activeCall.peerConnectionState === 'established')
      {
                try
                {
                    activeCall.sendMessage(message);
                }
                catch(exception)
                {
                    console.error('WebRTCommTestWebAppController:onClickSendMessage(): catched exception:'+exception); 
                }
            }
            else
            {
                console.error('WebRTCommTestWebAppController:onClickSendMessage(): session is not opened yet, thus cannot send message');      
            }
        });
        
    };

    /**
     * on send message event handler
     */ 
    TelScaleWebRTCPhoneController.prototype.sendDataMessage=function(contact, message)
    {
        console.debug ('WebRTCommTestWebAppController:onClickSendDataMessage()'); 

        //this.webRTCommActiveCalls.forEach(function (activeCall, contact) { NOT USED
        this.webRTCommActiveCalls.forEach(function (activeCall) {
      if(activeCall && activeCall.peerConnectionState === 'established')
      {
                try
                {
                    activeCall.sendDataMessage(message);
                }
                catch(exception)
                {
                    console.error('WebRTCommTestWebAppController:onClickSendDataMessage(): catched exception:'+exception); 
                }
            }
            else
            {
                $log.error('WebRTCommTestWebAppController:onClickSendDataMessage(): session is not opened yet, thus cannot send message');      
            }
        });
    };

    /**
     * on send message event handler
     */ 
    TelScaleWebRTCPhoneController.prototype.sendOfflineMessage=function(contact,message)
    {
        console.debug ('WebRTCommTestWebAppController:sendOfflineMessage()'); 

        try
        {
          //do not send messages to yourself
          if (contact !== this.webRTCommClientConfiguration.sip.sipUserName) {
            this.webRTCommClient.sendMessage(contact, message);             
          }
        }
        catch(exception)
        {
            console.error('WebRTCommTestWebAppController:sendOfflineMessage(): catched exception:'+exception); 
        }  
        
    };   


    /**
     * Message event
     * @public
     * @param {String} from phone number
     * @param {String} message message
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommMessageReceivedEvent = function(message) {
        $rootScope.$broadcast('playmyband.webrtc.message.received',message);
    };

    /**
     * Message received event
     * @public
     * @param {String} error
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommDataMessageSentEvent = function(message) {
        $rootScope.$broadcast('playmyband.webrtc.data.message.sent',message);    
    };

    /**
     * Message event
     * @public
     * @param {String} from phone number
     * @param {String} message message
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommDataMessageReceivedEvent = function(message) {
        $rootScope.$broadcast('playmyband.webrtc.data.message.received',message);  
    };

    /**
     * Message received event
     * @public
     * @param {String} error
     */
    TelScaleWebRTCPhoneController.prototype.onWebRTCommMessageSentEvent = function(message) {
        $rootScope.$broadcast('playmyband.webrtc.message.sent',message);    
    };

    /**
     * Message error event
     * @public
     * @param {String} error
     */
    // TelScaleWebRTCPhoneController.prototype.onWebRTCommMessageSendErrorEvent = function(message, error) { NOT USED
    TelScaleWebRTCPhoneController.prototype.onWebRTCommMessageSendErrorEvent = function(message) {
        $rootScope.$broadcast('playmyband.webrtc.message.send.error',message);
    };

    TelScaleWebRTCPhoneController.prototype.onWebRTCommDataMessageChannelOnOpenEvent = function() {
        $rootScope.$broadcast('playmyband.webrtc.datachannel.open');
    };    

    

    return {
      TelScaleWebRTCPhoneController:TelScaleWebRTCPhoneController
    };

  });
