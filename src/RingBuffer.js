'use strict';

class RingBuffer {
  constructor(capacity) {
    this._buffer = new Array(capacity);
    this.capacity = capacity;
    this._head = this._tail = this.length = 0;
  }

  push(data) {
    if (this.length < this._buffer.length)
      this.length++;

    this._buffer[this._head] = data;
    this._head = (this._head + 1) % this._buffer.length;
    if (this._tail === this._head) {
      this._tail = (this._tail + 1) % this._buffer.length;
    }
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.length; i++)
      yield this._buffer[(this._tail + i) % this.capacity];
  }
}

module.exports = RingBuffer;
