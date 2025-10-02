// Get the HTML elements we need to work with
const addButton = document.getElementById('add-habit-btn');
const habitInput = document.getElementById('habit-input');
const habitContainer = document.querySelector('.habit-container');

// This function creates the HTML for a new habit and adds it to the page
function createHabitElement(habitText) {
    // 1. Create a new div element. This is our main container for the habit.
    const habitDiv = document.createElement('div');
    habitDiv.classList.add('habit-item'); // Add a CSS class for styling

    // 2. Set the inner HTML of the div. We include the habit text and a delete button.
    habitDiv.innerHTML = `
        <span>${habitText}</span>
        <button class="delete-btn">Delete</button>
    `;

    // 3. Append the newly created div to the list container on the page.
    habitContainer.appendChild(habitDiv);
}

// Listen for a "click" event on the "Add Habit" button
addButton.addEventListener('click', function() {
    // Get the text from the input box and remove any extra whitespace
    const habitText = habitInput.value.trim();

    // Check if the user has actually typed something
    if (habitText !== '') {
        // If they have, call our function to create the new habit element
        createHabitElement(habitText);
        
        // Finally, clear the input box so they can add another habit
        habitInput.value = '';
    }
});