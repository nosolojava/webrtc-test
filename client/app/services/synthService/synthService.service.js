'use strict';
/*jslint bitwise: true */

angular.module('webrtcTestApp')
  .service('$synthService', function ($audioService) {
    // get sampleRate from audioService
    var sampleRate= $audioService.sampleRate;

    // AngularJS will instantiate a singleton by calling "new" on this function
    function SineGenerator(freq) {
      var self = {'alive': true};
      var period = sampleRate / freq;
      var t = 0;
      
      self.generate = function(buf, offset, count) {
        for (; count; count--) {
          var phase = t / period;
          var result = Math.sin(phase * 2 * Math.PI);
          buf[offset++] += result;
          buf[offset++] += result;
          t++;
        }
      };
      
      return self;
    }

      function SquareGenerator(freq, phase) {
        var self = {'alive': true};
        var period = sampleRate / freq;
        var t = 0;
        
        self.generate = function(buf, offset, count) {
          for (; count; count--) {
            var result = ( (t / period) % 1 > phase ? 1 : -1);
            buf[offset++] += result;
            buf[offset++] += result;
            t++;
          }
        };
        
        return self;
      }

    function ADSRGenerator(child, attackAmplitude, sustainAmplitude, attackTimeS, decayTimeS, releaseTimeS) {
      var self = {'alive': true};
      var attackTime = sampleRate * attackTimeS;
      var decayTime = sampleRate * (attackTimeS + decayTimeS);
      var decayRate = (attackAmplitude - sustainAmplitude) / (decayTime - attackTime);
      var releaseTime = null; /* not known yet */
      var endTime = null; /* not known yet */
      var releaseRate = sustainAmplitude / (sampleRate * releaseTimeS);
      var t = 0;
      
      self.noteOff = function() {
        if (self.released) {return;}
        releaseTime = t;
        self.released = true;
        endTime = releaseTime + sampleRate * releaseTimeS;
      };
      
      self.generate = function(buf, offset, count) {
        if (!self.alive) {return;}
        var input = new Array(count * 2);
        for (var i = 0; i < count*2; i++) {
          input[i] = 0;
        }
        child.generate(input, 0, count);
        
        var childOffset = 0;
        var ampl;
        while(count) {
          if (releaseTime !== null) {
            if (t < endTime) {
              /* release */
              while(count && t < endTime) {
                ampl = sustainAmplitude - releaseRate * (t - releaseTime);
                buf[offset++] += input[childOffset++] * ampl;
                buf[offset++] += input[childOffset++] * ampl;
                t++;
                count--;
              }
            } else {
              /* dead */
              self.alive = false;
              return;
            }
          } else if (t < attackTime) {
            /* attack */
            while(count && t < attackTime) {
              ampl = attackAmplitude * t / attackTime;
              buf[offset++] += input[childOffset++] * ampl;
              buf[offset++] += input[childOffset++] * ampl;
              t++;
              count--;
            }
          } else if (t < decayTime) {
            /* decay */
            while(count && t < decayTime) {
              ampl = attackAmplitude - decayRate * (t - attackTime);
              buf[offset++] += input[childOffset++] * ampl;
              buf[offset++] += input[childOffset++] * ampl;
              t++;
              count--;
            }
          } else {
            /* sustain */
            while(count) {
              buf[offset++] += input[childOffset++] * sustainAmplitude;
              buf[offset++] += input[childOffset++] * sustainAmplitude;
              t++;
              count--;
            }
          }
        }
      };
      
      return self;
    }

    function midiToFrequency(note) {
      return 440 * Math.pow(2, (note-69)/12);
    }

    var PianoProgram = {
      'attackAmplitude': 0.2,
      'sustainAmplitude': 0.1,
      'attackTime': 0.02,
      'decayTime': 0.3,
      'releaseTime': 0.02,
      'createNote': function(note, velocity) {
        var frequency = midiToFrequency(note);
        return new ADSRGenerator(
          new SineGenerator(frequency),
          this.attackAmplitude * (velocity / 128), this.sustainAmplitude * (velocity / 128),
          this.attackTime, this.decayTime, this.releaseTime
        );
      }
    };


    function FretsSynth(sampleRate) {
      
      var generators = [];
      
      function addGenerator(generator) {
        generators.push(generator);
      }
      
      function generate(samples) {
        console.log('generate ' + Date.now());        
        var data = new Array(samples*2);
        generateIntoBuffer(samples, data, 0);
        return data;
      }
      
      function generateIntoBuffer(samplesToGenerate, buffer, offset) {
        //console.log('generateIntoBuffer ' + Date.now());

        var i;
        for (i = offset; i < offset + samplesToGenerate * 2; i++) {
          buffer[i] = 0;
        }
        for (i = generators.length - 1; i >= 0; i--) {
          generators[i].generate(buffer, offset, samplesToGenerate);
          if (!generators[i].alive) {generators.splice(i, 1);}
        }
      }
      
      return {
        'sampleRate': sampleRate,
        'addGenerator': addGenerator,
        'generate': generate,
        'generateIntoBuffer': generateIntoBuffer
      };
    }

    return {
      PianoProgram:PianoProgram,
      FretsSynth:FretsSynth
    };


  });
