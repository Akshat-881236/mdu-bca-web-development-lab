const form = document.getElementById("registrationForm");
const message = document.getElementById("message");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const age = Number(document.getElementById("age").value);

    if (name.length < 3) {
        message.textContent = "Name must contain at least 3 characters.";
        message.style.color = "red";
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        message.textContent = "Enter a valid 10-digit phone number.";
        message.style.color = "red";
        return;
    }

    if (age < 16 || age > 60) {
        message.textContent = "Age must be between 16 and 60.";
        message.style.color = "red";
        return;
    }

    message.textContent = "Registration submitted successfully!";
    message.style.color = "green";

    form.reset();
});