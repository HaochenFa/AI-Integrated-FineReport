/**
 * @file fr-chat-integration.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description fr-chat-integration.js 模块的单元测试
 */

// todo)) 未通过的测试

import { jest } from "@jest/globals";

// Mock dependencies
jest.mock("../ui/chat-window.js");

describe("fr-chat-integration.js", () => {
  let frChatIntegrationModule;
  let mockChatWindow;

  // Helper to create a mock DOM element
  const createMockElement = (id, className, tagName = "div") => {
    const element = document.createElement(tagName);
    if (id) element.id = id;
    if (className) element.className = className;
    element.style = {}; // Mock style object
    element.addEventListener = jest.fn();
    element.removeEventListener = jest.fn();
    element.appendChild = jest.fn();
    element.querySelector = jest.fn();
    return element;
  };

  beforeEach(async () => {
    jest.resetModules();

    // Mock document object
    document.getElementById = jest.fn();
    document.querySelector = jest.fn();
    document.createElement = jest.fn((tagName) => createMockElement(null, null, tagName));
    document.body.appendChild = jest.fn();

    // Dynamically import the module after mocks are set up
    frChatIntegrationModule = await import("../fr-chat-integration.js");
    mockChatWindow = await import("../ui/chat-window.js");

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Default mock implementations
    mockChatWindow.showChatWindow.mockReturnValue(undefined);
    mockChatWindow.hideChatWindow.mockReturnValue(undefined);
    mockChatWindow.toggleChatWindow.mockReturnValue(undefined);
  });

  // Test 1: initFRChatIntegration should create chat button if it doesn't exist
  test("initFRChatIntegration should create chat button if it doesn't exist", () => {
    document.getElementById.mockReturnValue(null); // Button does not exist
    const mockToolbar = createMockElement(null, "fr-toolbar");
    document.querySelector.mockReturnValue(mockToolbar);

    frChatIntegrationModule.initFRChatIntegration();

    expect(document.getElementById).toHaveBeenCalledWith("ai-chat-button");
    expect(document.createElement).toHaveBeenCalledWith("button");
    expect(mockToolbar.appendChild).toHaveBeenCalledTimes(1);
  });

  // Test 2: initFRChatIntegration should do nothing if button already exists
  test("initFRChatIntegration should do nothing if button already exists", () => {
    const mockButton = createMockElement("ai-chat-button");
    document.getElementById.mockReturnValue(mockButton);

    frChatIntegrationModule.initFRChatIntegration();

    expect(document.getElementById).toHaveBeenCalledWith("ai-chat-button");
    expect(document.createElement).not.toHaveBeenCalled();
  });

  // Test 3: createChatButton should append to specified container
  test("createChatButton should append to specified container if buttonContainerId is provided", () => {
    const mockContainer = createMockElement("custom-container");
    document.getElementById.mockImplementation((id) => {
      if (id === "custom-container") return mockContainer;
      return null;
    });
    document.getElementById.mockReturnValueOnce(null); // For init check

    frChatIntegrationModule.initFRChatIntegration({ buttonContainerId: "custom-container" });

    expect(mockContainer.appendChild).toHaveBeenCalledTimes(1);
    expect(mockContainer.appendChild.mock.calls[0][0].id).toBe("ai-chat-button");
  });

  // Test 4: createChatButton should append to .fr-toolbar or .fr-btn-panel
  test("createChatButton should append to .fr-toolbar or .fr-btn-panel if no buttonContainerId", () => {
    document.getElementById.mockReturnValue(null); // Button does not exist
    const mockToolbar = createMockElement(null, "fr-toolbar");
    document.querySelector.mockImplementation((selector) => {
      if (selector === ".fr-toolbar") return mockToolbar;
      return null;
    });

    frChatIntegrationModule.initFRChatIntegration();

    expect(mockToolbar.appendChild).toHaveBeenCalledTimes(1);
    expect(mockToolbar.appendChild.mock.calls[0][0].id).toBe("ai-chat-button");
  });

  // Test 5: createChatButton should create new container if no existing container found
  test("createChatButton should create new container if no existing container found", () => {
    document.getElementById.mockReturnValue(null); // Button and custom container not found
    document.querySelector.mockReturnValue(null); // No toolbar or btn-panel

    frChatIntegrationModule.initFRChatIntegration();

    expect(document.createElement).toHaveBeenCalledWith("div"); // For the new container
    expect(document.body.appendChild).toHaveBeenCalledTimes(1);
    expect(document.body.appendChild.mock.calls[0][0].className).toBe("ai-chat-button-container");
    expect(document.body.appendChild.mock.calls[0][0].appendChild).toHaveBeenCalledTimes(1);
    expect(document.body.appendChild.mock.calls[0][0].appendChild.mock.calls[0][0].id).toBe(
      "ai-chat-button"
    );
  });

  // Test 6: Chat button click event listener calls toggleChatWindow
  test("chat button click event listener calls toggleChatWindow", () => {
    document.getElementById.mockReturnValue(null); // Button does not exist
    const mockToolbar = createMockElement(null, "fr-toolbar");
    document.querySelector.mockReturnValue(mockToolbar);

    frChatIntegrationModule.initFRChatIntegration();

    const chatButton = mockToolbar.appendChild.mock.calls[0][0];
    const clickHandler = chatButton.addEventListener.mock.calls.find(
      (call) => call[0] === "click"
    )[1];
    clickHandler();

    expect(mockChatWindow.toggleChatWindow).toHaveBeenCalledTimes(1);
  });

  // Test 7: showChatButton should set display to inline-block
  test("showChatButton should set display to inline-block", () => {
    const mockButton = createMockElement("ai-chat-button");
    document.getElementById.mockReturnValue(mockButton);

    frChatIntegrationModule.showChatButton();

    expect(mockButton.style.display).toBe("inline-block");
  });

  // Test 8: hideChatButton should set display to none
  test("hideChatButton should set display to none", () => {
    const mockButton = createMockElement("ai-chat-button");
    document.getElementById.mockReturnValue(mockButton);

    frChatIntegrationModule.hideChatButton();

    expect(mockButton.style.display).toBe("none");
  });
});
