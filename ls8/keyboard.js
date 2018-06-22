class Keyboard {
  /**
   * Construct a new Keyboard
   * @param {CPU} cpu The CPU this keyboard will attach to
   */
  constructor(cpu) {
    this.cpu = cpu;
    this.keyHandler = null;

    cpu.addPeripheral(this);

    this.start();
  }

  /**
   * Shutdown the keyboard peripheral
   */
  stop() {
    const stdin = process.stdin;

    stdin.setRawMode(false);
    stdin.removeListener('data', this.keyHandler);
    stdin.pause();
  }

  /**
   * Start up the keyboard peripheral
   * 
   * Raw mode code from
   * https://stackoverflow.com/questions/5006821/nodejs-how-to-read-keystrokes-from-stdin/5059872
   */
  start() {
    const stdin = process.stdin;

    // Without this, we would only get streams once enter is pressed
    stdin.setRawMode(true);

    // TODO: Is this necessary?
    stdin.resume();

    // Get UTF-8 back instead of a buffer
    stdin.setEncoding('utf8');

    // Set up the key handler
    this.keyHandler = (key) => {
      //console.log(key)
      // Since we're in raw mode, CTRL-C no longer breaks out of the process. We
      // need to end explicitly in this case.
      if ( key === '\u0003' ) { // Unicode (and ASCII) 3 is ^C
        console.log("^C");
        this.cpu.stop();
      }

      // Now that the key has been pressed, we need to do a couple things.

      // First, we need to set the keycode in memory address 0xF4 (memory-mapped
      // last key pressed).

      this.cpu.poke(0xF4, key.charCodeAt(0) & 0xff);

      // Secondly, we need to raise interrupt 1 to show that a key has been
      // pressed.

      this.cpu.raiseInterrupt(1); // Int 1 is the keyboard interrupt
    };

    stdin.on('data', this.keyHandler);
  }
}

module.exports = Keyboard;