// TODO : Complete all the information of the pokemons
// TODO : Add more types of pokemons
// TODO : Fixing design and bugs
// TODO : Make it more faster

// Declare an empty array to store the list of Pokémon
let pokemonList = [];

// Function to map each Pokémon type to a background color
function getTypeColor(type) {
  switch (type) {
    case "normal":
      return "bg-gray-400";
    case "fire":
      return "bg-red-500";
    case "water":
      return "bg-blue-500";
    case "grass":
      return "bg-green-500";
    case "electric":
      return "bg-yellow-400";
    case "ice":
      return "bg-blue-200";
    case "fighting":
      return "bg-red-700";
    case "poison":
      return "bg-purple-500";
    case "ground":
      return "bg-yellow-700";
    case "flying":
      return "bg-blue-300";
    case "psychic":
      return "bg-purple-400";
    case "bug":
      return "bg-green-400";
    case "rock":
      return "bg-gray-600";
    case "ghost":
      return "bg-purple-800";
    case "dragon":
      return "bg-red-800";
    case "dark":
      return "bg-gray-800";
    case "steel":
      return "bg-gray-500";
    case "fairy":
      return "bg-pink-400";
    default:
      return "bg-gray-200";
  }
}

// Fetch the first 898 Pokémon from the PokeAPI
fetch("https://pokeapi.co/api/v2/pokemon?limit=1025")
  .then((response) => {
    // Check if the response is okay
    if (!response.ok) {
      throw new Error("Failed to fetch Pokemon list");
    }
    return response.json(); // Parse the response JSON
  })
  .then((data) => {
    pokemonList = data.results; // Store the list of Pokémon in the array
  })
  .catch((error) => {
    alert(error.message); // Display an alert if there's an error
  });

// Function to search for a Pokémon
function searchPokemon() {
  // Get the input value and convert it to lowercase
  const input = document
    .getElementById("pokemon-name")
    .value.toLowerCase()
    .trim();
  // Check if the input is empty
  if (!input) {
    alert("Please enter a Pokemon name or ID.");
    return;
  }

  // Open the modal
  const modal = document.getElementById("pokemon-modal");
  modal.checked = true;

  // Display a loading spinner in the modal content
  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML =
    '<span class="loading loading-spinner loading-xs"></span>';

  // Fetch the Pokémon data from the API
  fetch(`https://pokeapi.co/api/v2/pokemon/${input}`)
    .then((response) => {
      // Check if the response is okay
      if (!response.ok) {
        throw new Error("Pokemon not found!");
      }
      return response.json();
    })
    .then((data) => {
      // Display the data in the modal
      modalContent.innerHTML = ""; // Clear the loading spinner
      displayPokemonInModal(data, modalContent); // Display the Pokémon data in the modal
      console.log(data);
    })
    .catch((error) => {
      modalContent.innerHTML = ""; // Clear the loading spinner
      alert(error.message); // Display an alert if there's an error
    });
}

// Function to display the Pokémon data in the modal
async function displayPokemonInModal(data, container) {
  const infoDiv = document.createElement("div"); // Create a div for the Pokémon information
  infoDiv.classList.add("flex", "flex-col", "items-center", "w-48");
  const statsDiv = document.createElement("div"); // Create a div for the Pokemon stats
  statsDiv.classList.add("flex", "flex-col", "w-64");
  const name = document.createElement("h3"); // Create a heading element for the Pokémon name
  name.textContent = data.name.charAt(0).toUpperCase() + data.name.slice(1); // Set the text content to the Pokémon name

  const image = document.createElement("img"); // Create an image element for the Pokémon sprite
  image.src = data.sprites.front_default; // Set the image source to the Pokémon sprite
  image.alt = data.name; // Set the alt text to the Pokémon name
  image.classList.add("cursor-pointer"); // Add cursor pointer style to the image

  // Toggle between regular and shiny sprite URLs when clicking the image
  image.addEventListener("click", () => {
    if (image.src === data.sprites.front_default) {
      image.src = data.sprites.front_shiny;
    } else {
      image.src = data.sprites.front_default;
    }
  });

  const types = document.createElement("p"); // Create a paragraph element for the Pokémon types
  types.textContent = `Types: ${data.types
    .map((type) => type.type.name)
    .join(", ")}`; // Set the text content to the Pokémon types

  const abilities = document.createElement("p"); // Create a paragraph element for the Pokémon abilities
  abilities.textContent = `Abilities: ${data.abilities
    .map((ability) => ability.ability.name)
    .join(", ")}`; // Set the text content to the Pokémon abilities

  const height = document.createElement("p"); // Create a paragraph element for the Pokémon height
  height.textContent = `Height: ${data.height} decimetres`; // Set the text content to the Pokémon height

  const weight = document.createElement("p"); // Create a paragraph element for the Pokémon weight
  weight.textContent = `Weight: ${data.weight} hectograms`; // Set the text content to the Pokémon weight

  const description = await getPokemonDescription(data.species.url);
  const weaknesses = await getPokemonWeaknesses(data.types[0].type.name);
  const resistance = await getPokemonResistance(data.types[0].type.name);

  const descriptionDiv = document.createElement("p"); // Create a paragraph element for the Pokémon description
  descriptionDiv.textContent = description; // Set the text content to the Pokémon description

  // Adding Weaknesses and Resistance
  const weaknessDiv = document.createElement("div");
  weaknessDiv.textContent = `Weaknesses: ${weaknesses.join(", ")}`;
  const resistanceDiv = document.createElement("div");
  resistanceDiv.textContent = `Resistances: ${resistance.join(", ")}`;

  const statsCanvas = document.createElement("canvas"); // Create a canvas element for the stats chart
  statsCanvas.id = "stats-chart"; // Set the id of the canvas
  statsCanvas.width = 200; // Set the width of the canvas
  statsCanvas.height = 200; // Set the height of the canva

  infoDiv.appendChild(name); // Append the name to the info div
  infoDiv.appendChild(image); // Append the image to the info div
  infoDiv.appendChild(types); // Append the types to the info div
  infoDiv.appendChild(descriptionDiv); // Append the description to the info div
  infoDiv.appendChild(height); // Append the height to the info div
  infoDiv.appendChild(weight); // Append the weight to the info div

  statsDiv.appendChild(statsCanvas); // Append the stats to the stats div
  statsDiv.appendChild(abilities); // Append the abilities to the info div
  statsDiv.appendChild(weaknessDiv); // Append the weaknesses to the info div
  statsDiv.appendChild(resistanceDiv); // Append the resistances to the info div

  container.appendChild(infoDiv); // Append the info div to the container
  container.appendChild(statsDiv); // Append the stats div to the container
  container.classList.add(
    "flex",
    "flex-row",
    "justify-between",
    "items-center",
    "gap-2"
  );

  // Create a Chart.js chart for the Pokémon stats
  const ctx = statsCanvas.getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.stats.map((stat) => stat.stat.name),
      datasets: [
        {
          label: "Base Stats",
          data: data.stats.map((stat) => stat.base_stat),
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

async function getPokemonDescription(speciesUrl) {
  const descRes = await fetch(speciesUrl);
  const descData = await descRes.json();
  const flavorTextEntry = descData.flavor_text_entries.find(
    (entry) => entry.language.name === "en"
  );
  return flavorTextEntry
    ? flavorTextEntry.flavor_text
    : "Description not available";
}

async function getPokemonWeaknesses(typeName) {
  const typeRes = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
  const typeData = await typeRes.json();
  return typeData.damage_relations.double_damage_from.map(
    (weakness) => weakness.name
  );
}
async function getPokemonResistance(typeName) {
  const typeRes = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
  const typeData = await typeRes.json();
  return typeData.damage_relations.half_damage_from.map(
    (resistance) => resistance.name
  );
}

// Event listener for when the document is loaded
document.addEventListener("DOMContentLoaded", function () {
  showAllPokemon(); // Display all Pokémon when the page is loaded
});

// Function to display all Pokémon
function showAllPokemon() {
  const container = document.getElementById("pokemon-container");
  container.innerHTML =
    '<span class="loading loading-spinner loading-lg"></span>'; // Display a loading spinner while fetching Pokémon data

  // Fetch all Pokémon data from the API
  fetch("https://pokeapi.co/api/v2/pokemon?limit=1025")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch Pokemon list");
      }
      return response.json(); // Parse the response JSON
    })
    .then((data) => {
      // Map through the list of Pokémon and fetch each Pokémon's details
      const promises = data.results.map((pokemon) =>
        fetch(pokemon.url).then((response) => response.json())
      );
      Promise.all(promises).then((results) => {
        container.innerHTML = ""; // Clear the loading spinner
        displayAllPokemon(results); // Display all Pokémon in the container
      });
    })
    .catch((error) => {
      container.innerHTML = ""; // Clear the loading spinner
      alert(error.message); // Display an alert if there's an error
    });
}

// Function to display all Pokémon in the dropdown
function displayAllPokemon(pokemonList) {
  const container = document.getElementById("pokemon-container");
  container.innerHTML = "";

  // Loop through each Pokémon and create a div for each
  pokemonList.forEach((pokemon) => {
    const pokemonDiv = document.createElement("div"); // Create a div element for the Pokémon
    pokemonDiv.classList.add(
      "pokemon",
      "flex",
      "flex-col",
      "items-center",
      getTypeColor(pokemon.types[0].type.name)
    );

    // Create a heading element for the Pokémon name
    const name = document.createElement("h3");
    name.textContent =
      pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

    // Create an image element for the Pokémon sprite
    const image = document.createElement("img");
    image.src = pokemon.sprites.front_default;
    image.alt = pokemon.name;
    image.classList.add("w-24", "h-24");

    // Create a paragraph element for the Pokémon types
    const types = document.createElement("p");
    types.textContent = `Types: ${pokemon.types
      .map((type) => type.type.name)
      .join(", ")}`;
    const id = document.createElement("p");
    id.textContent = `ID: ${pokemon.id}`;
    pokemonDiv.appendChild(name); // Append the name to the div
    pokemonDiv.appendChild(id);
    pokemonDiv.appendChild(image); // Append the image to the div
    pokemonDiv.appendChild(types); // Append the types to the div

    pokemonDiv.addEventListener("click", () => {
      // Create a modal and display more details
      const modal = document.getElementById("pokemon-modal");
      modal.checked = true; // Open the modal

      const modalContent = document.getElementById("modal-content");
      modalContent.innerHTML = `<span class="loading loading-spinner loading-xs"></span>`;

      fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.name}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Pokemon not found!");
          }
          return response.json();
        })
        .then((data) => {
          modalContent.innerHTML = ""; // Clear the loading spinner
          displayPokemonInModal(data, modalContent);
        })
        .catch((error) => {
          modalContent.innerHTML = ""; // Clear the loading spinner
          alert(error.message);
        });
    });

    container.appendChild(pokemonDiv); // Append the div to the container
  });
}

// Function to search for Pokémon in the dropdown
function searchPokemonDropdown(event) {
  const input = event.target.value.toLowerCase().trim(); // Get the input value and convert it to lowercase
  const dropdown = document.getElementById("pokemon-dropdown"); // Get the dropdown element
  dropdown.innerHTML = ""; // Clear the dropdown content

  // Filter the list of Pokémon based on the input
  const filteredPokemon = pokemonList.filter((pokemon) =>
    pokemon.name.startsWith(input)
  );

  // Display up to 5 Pokémon in the dropdown that match the input
  filteredPokemon.slice(0, 5).forEach((pokemon) => {
    const listItem = document.createElement("li"); // Create a list item element
    const anchor = document.createElement("a"); // Create an anchor element
    anchor.textContent =
      pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1); // Set the text content of the anchor
    anchor.href = "#"; // Set the href attribute of the anchor
    anchor.onclick = () => {
      document.getElementById("pokemon-name").value = pokemon.name; // Set the input value to the selected Pokémon name
      dropdown.innerHTML = ""; // Clear the dropdown content
      searchPokemon(); // Call the searchPokemon function to display the selected Pokémon
    };
    listItem.appendChild(anchor); // Append the anchor to the list item
    dropdown.appendChild(listItem); // Append the list item to the dropdown
  });

  // Display or hide the dropdown based on the filtered Pokémon
  if (filteredPokemon.length > 0) {
    dropdown.style.display = "block";
  } else {
    dropdown.style.display = "none";
  }
}
