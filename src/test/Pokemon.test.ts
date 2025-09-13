import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import App from "../App.vue"; // 👈 adjust path depending on where the test file lives

describe("App.vue", () => {
  it("renders name and version", () => {
    const wrapper = mount(App);

    expect(wrapper.find("h1").text()).toBe("Pokedex 2.0");
  });
});
