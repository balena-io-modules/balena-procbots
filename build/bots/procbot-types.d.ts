// ProcBot --------------------------------------------------------------------

// ProcBot configuration format.
// This includes any ProcBot class specific variables, as well as any
// potential child bot configurations (of type `any`, ProcBot does not care
// what these may be)
export interface ProcBotConfiguration {
    procbot: {
        minimum_version?: number | boolean;
    };
}
