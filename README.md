# Wooting JS API
This .js file will let you read analog input **directly** from your Wooting keyboard into your own Javascript code. This API is based loosely off of the original [Wooting Analog SDK](https://github.com/WootingKb/wooting-analog-sdk) with some minor changes and additions.

> **Note:** This API makes use of the WebUSB feature. [Only certain browsers are supported.](https://caniuse.com/#feat=webusb)

## Usage
#### `checkIfBrowserSupported()`
Returns whether or not the current browser supports WebUSB.


#### `new WootingKeyboard([pollingRate])`
- `pollingRate` - How often the listener should be updated, in Hz

Creates a new keyboard object. Multiple keyboard instances can be created and can be addressed individually. Use member functions to interact with the device.


#### `this.wooting_kbd_connected([selectNewKeyboard])`
- `selectNewKeyboard` - Runs `this.wooting_keyboard_connect()`, even if a current connection is active.
Checks if the `this` keyboard is currently connected. If a connection hasn't been initialized, `this.wooting_keyboard_connect()` is ran  and returns it's success`. If a keyboard has been initialized, but is no longer connected, returns `false`. If a connection is active, returns `true`.


#### `this.wooting_set_disconnected_cb(func)`
- `func` - A function to set as a callback
Sets function `func` as a callback for when `this` is disconnected.


#### `this.wooting_keyboard_disconnect()`
Forcefully closes connection to keyboard and reset values.


#### `this.wooting_read_analog(row, column)`
- `row` - A specificed Y coordinate
- `column` - A specificed X coordinate
Returns the analog value (0-255) of the key at (column, row).


#### `this.wooting_read_full_buffer()`
Returns a buffer (array) of up to 16 keys (32 bytes/ints). Example: [0,147,3,255] would be Escape pressed 58%, and "3" pressed 100%.


#### `this.wooting_refresh_buffer()`
Manually refreshes key buffer. Stores updated buffer in `this.buffer` and moves current buffer to `this.oldBuffer`. Returns whether or not the buffer was refreshed successfully.


> **Note:** View `scan_index_array` in `wooting.js` to see the row and column of each key (255 means no key).

#### `async this.wooting_keyboard_connect()`
Creates a prompt for the user to select their Wooting Keyboard, then sets up the object for using. Returns a promise

> **Note:** This function *MUST* be triggered but a user action. If it is not, it will fail.

