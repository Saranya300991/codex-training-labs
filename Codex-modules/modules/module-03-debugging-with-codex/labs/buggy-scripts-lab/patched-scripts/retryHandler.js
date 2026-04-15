const input = Number(process.argv[2]);
const maxRetries = Number.isInteger(input) && input >= 0 ? input : 0;
const windows = new Array(maxRetries).fill(1000);

console.log("Retry windows:", windows);
