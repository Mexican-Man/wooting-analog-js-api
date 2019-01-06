# Wooting JS API
IMPORTANT: I don't have a Wooting keyboard yet, so this probably doesn't work entirely.

This .js file will let you read analog input **directly** from your Wooting keyboard into your own Javascript code. This API is based loosely off of the original [Wooting Analog SDK](https://github.com/WootingKb/wooting-analog-sdk) with some minor changes and additions.

> **Note:** This API makes use of the WebUSB feature. [Only certain browsers are supported.](https://caniuse.com/#feat=webusb)

> **Another Note:** According to Google, this should only be useable on HTTPS. It seems to work fine on `file:\\\` as well.

## Usage
#### `checkIfBrowserSupported()`
Returns whether or not the current browser supports WebUSB.


#### `new WootingKeyboard([pollingRate])`
- `pollingRate` - How often the listener should be updated, in Hz

Creates a new keyboard object. Multiple keyboard instances can be created and can be addressed individually. Use member functions to interact with the device.


#### `WootingKeyboard.Prototype.wooting_kbd_connected([selectNewKeyboard])`
Returns whether or not a keyboard is connected.


#### `WootingKeyboard.Prototype.wooting_set_disconnected_cb(func)`
- `func` - A function to set as a callback
Sets function `func` as a callback for when `this` is disconnected.


#### `WootingKeyboard.Prototype.wooting_keyboard_disconnect()`
Forcefully closes connection to keyboard and reset values.


#### `WootingKeyboard.Prototype.wooting_read_analog(row, column)`
- `row` - A specificed Y coordinate
- `column` - A specificed X coordinate
Returns the analog value (0-255) of the key at (column, row).


#### `WootingKeyboard.Prototype.wooting_read_full_buffer()`
Returns a buffer (array) of up to 16 keys (32 bytes/ints). Example: [0,147,3,255] would be Escape pressed 58%, and "3" pressed 100%.

> **Note:** Alternatively, you can just read `this.buffer` to get *ALL* key values, regardless of value.


#### `WootingKeyboard.Prototype.wooting_refresh_buffer()`
Manually refreshes key buffer. Stores updated buffer in `this.buffer` and moves current buffer to `this.oldBuffer`. Returns whether or not the buffer was refreshed successfully.


> **Note:** View `scan_index_array` in `wooting.js` to see the row and column of each key (255 means no key).

#### `async WootingKeyboard.Prototype.wooting_keyboard_connect([selectedDevice])`
- `selectedDevice` - A device object that you want to connect to (if this argument is specificed, no user action is needed)
Creates a prompt for the user to select their Wooting Keyboard, then sets up the object for using. Returns a promise that is rejected or fulfilled based on whether or not a connection was made.

> **Note:** This function *MUST* be triggered but a user action. If it is not, it will fail.

#### `async WootingKeyboard.Prototype.wooting_keyboard_reconnect()`
Attempts to reconnect to a previously paired keyboard (the first one available). Returns a promise that is rejected or fulfilled based on whether or not a connection was made.

### `WootingKeyboard.Prototype.addAnalogListener(func)`
- `func` - A function to run when the key buffer changes
Adds a function to a list of functions to run when a key is updated. Returns nothing

## Examples
Here is a short example of what your setup could look like:
```HTML
<body>
  <button onClick="">Click Here!</button>
  <script>
			var keyboard = new WootingKeyboard(50);
			async function color() {

				// Prompt user to select a keyboard
				var result = await keyboard.wooting_keyboard_connect().then(() => {
					document.getElementsByTagName("button")[0].classList = "btn btn-lg btn-block btn-success"; // If successful, turn button green
					
					// Set device properties
					document.getElementById("deviceName").innerHTML = keyboard.deviceName;
					document.getElementById("productId").innerHTML = keyboard.PRODUCT_ID;
					document.getElementById("pollingRate").innerHTML = keyboard.pollingRate;

					// And, whenever a value changes, log the keys being pressed (in buffer form) into the console
					keyboard.addAnalogListener(() => {
						read();
						console.log(keyboard.wooting_read_full_buffer());
						keyboard.wooting_set_disconnected_cb(() =>{
							document.getElementsByTagName("button")[0].classList = "btn btn-lg btn-block btn-danger";
							document.getElementById("deviceName").innerHTML = "";
							document.getElementById("productId").innerHTML = "";
							document.getElementById("pollingRate").innerHTML = "";
						})
					});
					return true;
				}).catch(() => {
					document.getElementsByTagName("button")[0].classList = "btn btn-lg btn-block btn-danger"; // Else, turn the button red
					return false;
			  	});
				console.log(result);
			}
			
			function read() {
				for (var i = 0; i < keyboard.buffer.length/2; i+=2) {
					var analog = buffer[i+1];
					if (analog >  0) {
						document.getElementById(buffer[i]).style.color = "rgb(" + analog + ",0,255)";
					} else {
						document.getElementById(buffer[i]).style.color = "#FFF";
					}
				}
			}
  </script>
</body>
```
