const btn = document.getElementById("btn");
const msg = document.getElementById("msg");
let count = 0;

btn.addEventListener("click", function () {
  count = count + 1;
  msg.textContent = "你已经点了 " + count + " 次。";
});
