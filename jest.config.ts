import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	moduleFileExtensions: ["ts", "js"],
    roots: ["<rootDir>/tests"],
    verbose: true,
};

export default config;
