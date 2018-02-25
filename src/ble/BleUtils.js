'use strict';

function createTimeoutPromise(timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Request timed out.')), timeout);
  });
}

async function readString(device, uuid) {
  const data = await device.readCharacteristic(uuid);
  let end = data.indexOf(0);
  if (end === -1) {
    end = data.length;
  }

  return data.toString('utf-8', 0, end);
}

module.exports = {
  readString: readString,
  createTimeoutPromise: createTimeoutPromise
};