const WOOTING_RGB_ROWS = 6;
const WOOTING_RGB_COLS = 21;
const VENDOR_ID = 1003; // Wooting Vendor ID
const scan_index_array = [
	[0, 255, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 107, 108, 109, 110],
	[16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 61, 106, 105, 104, 103],
	[32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 62, 102, 101, 100, 99],
	[48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 45, 60, 255, 255, 255, 98, 97, 96, 255],
	[64, 87, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 255, 75, 255, 63, 255, 90, 91, 92, 93],
	[80, 81, 82, 255, 255, 255, 83, 255, 255, 255, 84, 85, 86, 79, 76, 77, 78, 255, 95, 94, 255]
]; // Key number for every single key
var event = new CustomEvent("analogkeypress")
class WootingKeyboard {
	constructor(pollingRate = 50) {
		this.device; 			// Keyboard "device"
		this.dcCallback; 		// Custom callback for when disconnected
		this.buffer = []; 		// Buffer for keys being pressed
		this.oldBuffer = [];	// Buffer for keys pressed last poll
		this.PRODUCT_ID; 		// Product ID for the device
		this.deviceName; 		// Name of the keyboard
		this.pollingRate = pollingRate;
		this.poller;
	}

	/*	------------------
		Internal functions
		------------------	*/
	
	// Polling for listeners
	wooting_keyboard_poll() {
		if (oldBuffer !== buffer) {
			this.dispatchEvent(event);
		}
		// Assign to cancellable variable
		this.poller = setTimeout(wooting_keyboard_poll, 1000/parseInt(this.pollingRate));
	}
	
	// Prompts the user to select a Wooting, then attempts to open connection. Returns whether or not successful
	async wooting_keyboard_connect() {

		// Let user select desired keyboard
		await navigator.usb.requestDevice({
				filters: [{
					vendorId: VENDOR_ID
				}]
			}).then(selectedDevice => {
				// If keyboard is found
				this.PRODUCT_ID = selectedDevice.productId;

				// Assign device name
				switch (this.PRODUCT_ID) {
				case 65281:
					this.deviceName = "Wooting One";
					break;
				case 65282:
					this.deviceName = "Wooting Two";
					break;
				}

				this.device = selectedDevice; // Assign device object
				this.device.open(); // Open connection to device object

				// Set disconnect listener for dcCallback
				navigator.usb.addEventListener('disconnect', () => {
					this.device.wooting_keyboard_disconnect();
				});
			})
			.then(() => this.device.selectConfiguration(1))
			.then(() => this.device.claimInterface(2))
			.then(function () {
				// Return successful
				this.poller = setTimeout(wooting_keyboard_poll, 1000/parseInt(this.pollingRate));
				resolve(true);
			})
			.catch(function () {
				// If keyboard is not found, return false
				this.device = undefined;
				resolve(false);
			});
	}

	// Callback for receiving HID data, returns raw data from keyboard
	async wooting_keyboard_receive() {
		await this.device.controlTransferIn(0, 32).then(result => {
			return result;
		});
	}

	/*	----------------------------
		Native Wooting SDK functions
		----------------------------	*/

	// Disconnect keyboard, returns nothing
	wooting_keyboard_disconnect() {
		if (this.device != undefined) {
			this.device.close();
			this.device = undefined;
			this.buffer = [];
			this.oldBuffer = [];
			this.PRODUCT_ID = undefined;
			this.deviceName = undefined;
			this.poller = undefined;
			this.dcCallback();
		}
	}

	// Refresh key buffer, returns whether or not successful
	wooting_refresh_buffer() {
		// Checks if device has been connected
		if (this.device == undefined) {
			return false;
		}
		try {
			this.oldBuffer = this.buffer.slice();
			this.buffer = this.wooting_keyboard_receive();
			return true;
		} catch (err) {
			return false;
		}
	}

	// Return whether or not keyboard is detected
	wooting_kbd_connected(selectNewKeyboard = false) {
		return new Promise(resolve => {
			// Force to request new keyboardif it hasn't been set yet
			if (this.device === undefined || this.selectNewKeyboard) {
				this.wooting_keyboard_disconnect();
				resolve(this.wooting_keyboard_connect());
			} else if (this.wooting_refresh_buffer()) {
				resolve(true);
			} else {
				resolve(false);
			}
		});

	}

	// Set callbacks for different tabs, returns nothing
	wooting_set_disconnected_cb(func) {
		this.dcCallback = func;
	}

	// Read and return value of specific key
	wooting_read_analog(row, column) {

		// Update buffer
		if (!this.wooting_refresh_buffer()) {
			return 0;
		}
		// Check if coordinates are valid
		if (row > (WOOTING_RGB_ROWS - 1) || column > (WOOTING_RGB_COLS - 1)) {
			return 0;
		}

		// Find value in buffer
		var scan_index = scan_index_array[row][column];
		for (var i = 0; i < this.buffer.length(); i += 2) {
			if (this.buffer[i - 1] == scan_index) {
				// Cap out values to a maximum
				if (this.buffer[i] > 225) {
					return 255;
				} else {
					return this.buffer[i];
				}
			}
		}
		return 0;
	}

	// Read and return buffer of 16 keys pressed
	wooting_read_full_buffer() {

		// Update buffer
		if (!this.wooting_refresh_buffer()) {
			return 0;
		}

		// Iterate through 16 values to send
		for (var i = 0; i < 32; i += 2) {
			var scan_code = this.buffer[i];
			var analog_value = this.buffer[i + 1];
			var data = [];

			// Send if value is not 0 (not pressed)
			if (analog_value > 0) {
				data.push(scan_code); // Send key first

				// Cap out values to a maximum
				if (analog_value > 225) {
					analog_value = 255;
				}
				data.push(analog_value); // Send key value second
			} else {
				return data;
			}
		}
		return data;
	}

}

// Check if browser is supported, returns true or false
function checkIfSupportedBrowser() {
	if (navigator.usb == undefined) {
		return false;
	}
	return true;
}