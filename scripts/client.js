(function() {
  
    function playNext(step) {
      for (var i = 0; i < dropdown.options.length; i++) {
        var index = (dropdown.selectedIndex + (1 + i) * step + dropdown.options.length) % dropdown.options.length;
  
        var option = dropdown.options[index];
        if (option && option.value) {
          window.location = option.value;
          break;
        }
      }
    }
  
    var playbtn = document.getElementById('playbtn');
    var status = document.getElementById('status');
    var info = document.getElementById('info');
  
    // wrap testbed with ui
    var _testbed = planck.testbed;
    planck.testbed = function(opts, callback) {
      _testbed(opts, function(testbed) {
    
        testbed._pause = function() {
          playbtn.className = playbtn.className.replace('pause', 'play');
        };
  
        testbed._resume = function() {
          playbtn.className = playbtn.className.replace('play', 'pause');
        };
  
        status.innerText = '';
        info.innerText = '';
  
        var _lastStatus = '';
        var _lastInfo = '';
  
        testbed._status = function(statusText, statusMap) {
          var newline = '\n';
          var string = statusText || '';
          for (var key in statusMap) {
            var value = statusMap[key];
            if (typeof value === 'function') continue;
            string += (string && newline) + key + ': ' + value;
          }
  
          if (_lastStatus !== string) {
            status.innerText = _lastStatus = string;
          }
        };
  
        testbed._info = function(text) {
          if (_lastInfo !== text) {
            info.innerText = _lastInfo = text;
          }
        };
  
        var world = callback.apply(null, arguments);
  
        testbed.resume();
  
        return world;
      });
    };
  
  })();