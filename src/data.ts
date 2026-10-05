import type { Race } from "./features";

// The dataset itself was only on Kaggle, behind the competition's sign-up, so it isn't here.
// These are the only pieces of real games the notebooks printed: the first few actions of
// training games 0 to 4 and test games 0 to 4 (pandas cuts the rows off after 8 to 10 tokens),
// and the example line from the competition's data page.
export interface Example {
  id: string;
  label: string;
  race: Race;
  player?: number;
  source: string;
  actions: string[];
}

export const EXAMPLES: Example[] = [
  {
    id: "train-0", label: "Training game 0", race: "Protoss", player: 53,
    source: "notebook-rf-v1, cells 5 and 25",
    actions: ["Base", "s", "s", "s", "s", "s", "t5", "Base", "s", "hotkey30"],
  },
  {
    id: "train-1", label: "Training game 1", race: "Protoss", player: 29,
    source: "notebook-rf-v1, cells 5 and 25",
    actions: ["s", "Base", "s", "s", "Base", "s", "s", "Base", "s", "t5"],
  },
  {
    id: "train-2", label: "Training game 2", race: "Protoss", player: 53,
    source: "notebook-rf-v1, cells 5 and 25",
    actions: ["Base", "s", "s", "s", "Base", "s", "hotkey30", "hotkey00"],
  },
  {
    id: "train-3", label: "Training game 3", race: "Protoss", player: 29,
    source: "notebook-rf-v1, cells 5 and 25",
    actions: ["Base", "s", "s", "Base", "s", "s", "s", "t5", "Base", "s"],
  },
  {
    id: "train-4", label: "Training game 4", race: "Protoss", player: 53,
    source: "notebook-rf-v1, cell 5",
    actions: ["Base", "s", "s", "s", "Base", "s", "hotkey30", "hotkey00"],
  },
  {
    id: "test-0", label: "Test game 0", race: "Zerg",
    source: "notebook-rf-v1, cells 7 and 46",
    actions: ["s", "s", "s", "hotkey10", "s", "hotkey60", "s", "hotkey00", "s"],
  },
  {
    id: "test-1", label: "Test game 1", race: "Terran",
    source: "notebook-rf-v1, cells 7 and 46",
    actions: ["s", "hotkey30", "hotkey00", "t5", "s", "hotkey32", "s", "hotkey32", "s"],
  },
  {
    id: "test-2", label: "Test game 2", race: "Protoss",
    source: "notebook-rf-v1, cells 7 and 46",
    actions: ["Base", "s", "s", "Base", "s", "hotkey20", "hotkey30", "hotkey60", "hotkey40"],
  },
  {
    id: "test-3", label: "Test game 3", race: "Zerg",
    source: "notebook-rf-v1, cells 7 and 46",
    actions: ["s", "s", "s", "s", "hotkey20", "s", "hotkey40", "t5", "t10"],
  },
  {
    id: "test-4", label: "Test game 4", race: "Protoss",
    source: "notebook-rf-v1, cells 7 and 46",
    actions: ["Base", "s", "s", "Base", "s", "hotkey50", "hotkey30", "t5", "hotkey40"],
  },
  {
    id: "data-page", label: "The competition's own example", race: "Protoss",
    source: "the data page of the Kaggle competition",
    actions: ["Base", "s", "s", "s", "s", "s", "t5", "Base", "s", "hotkey30", "hotkey00", "t10", "t15"],
  },
];

// What the notebook printed for the same games computed on their full logs (cells 34 and 47).
// pandas only showed the first and last columns, so this is 16 of the 45 rates.
export const PRINTED_FULL_GAME: Record<string, Record<string, number>> = {
  "train-0": {
    start_hk_0: 0.028571, start_hk_1: 0, start_hk_2: 0, start_hk_3: 0.342857, start_hk_4: 0, start_hk_5: 0,
    mid_hk_5: 0.086878, mid_hk_6: 0.011765, mid_hk_7: 0, mid_hk_8: 0, mid_hk_9: 0.00362,
    mid_hk_created: 0.084163, mid_hk_used: 0.853394, mid_base: 0.053394, mid_mineral: 0.000905, mid_other: 0.39457,
  },
  "train-1": {
    start_hk_0: 0, start_hk_1: 0.083333, start_hk_2: 0, start_hk_3: 0.65, start_hk_4: 0, start_hk_5: 0,
    mid_hk_5: 0, mid_hk_6: 0, mid_hk_7: 0, mid_hk_8: 0.009009, mid_hk_9: 0.015315,
    mid_hk_created: 0.066667, mid_hk_used: 0.816216, mid_base: 0.007207, mid_mineral: 0, mid_other: 0.309009,
  },
  "test-0": {
    start_hk_0: 1.416667, start_hk_1: 0.05, start_hk_2: 0.083333, start_hk_3: 0, start_hk_4: 0, start_hk_5: 0, start_hk_6: 1.5,
    mid_hk_5: 0, mid_hk_6: 0.95155, mid_hk_7: 0.077519, mid_hk_8: 0, mid_hk_9: 0.034884,
    mid_hk_created: 0.03876, mid_hk_used: 2.468992, mid_base: 0.017442, mid_mineral: 0, mid_other: 1.187984,
  },
  "test-1": {
    start_hk_0: 0.018182, start_hk_1: 0.218182, start_hk_2: 0.018182, start_hk_3: 1.036364, start_hk_4: 0, start_hk_5: 0, start_hk_6: 0,
    mid_hk_5: 0.252396, mid_hk_6: 0, mid_hk_7: 0, mid_hk_8: 0, mid_hk_9: 0.065495,
    mid_hk_created: 0.0623, mid_hk_used: 1.140575, mid_base: 0, mid_mineral: 0, mid_other: 0.573482,
  },
  "test-2": {
    start_hk_0: 0, start_hk_1: 0, start_hk_2: 0.3, start_hk_3: 0.166667, start_hk_4: 0.016667, start_hk_5: 0, start_hk_6: 1.283333,
    mid_hk_5: 0, mid_hk_6: 0.729412, mid_hk_7: 0.035294, mid_hk_8: 0.042353, mid_hk_9: 0,
    mid_hk_created: 0.12, mid_hk_used: 2.130588, mid_base: 0.018824, mid_mineral: 0, mid_other: 0.410588,
  },
  "test-3": {
    start_hk_0: 0, start_hk_1: 0, start_hk_2: 0.254545, start_hk_3: 0, start_hk_4: 0.618182, start_hk_5: 0, start_hk_6: 0,
    mid_hk_5: 0.004525, mid_hk_6: 0.00362, mid_hk_7: 0, mid_hk_8: 0, mid_hk_9: 0,
    mid_hk_created: 0.069683, mid_hk_used: 0.80543, mid_base: 0.009955, mid_mineral: 0.000905, mid_other: 1.235294,
  },
  "test-4": {
    start_hk_0: 0, start_hk_1: 0, start_hk_2: 0, start_hk_3: 0.016667, start_hk_4: 0.016667, start_hk_5: 0.333333, start_hk_6: 0,
    mid_hk_5: 0.035714, mid_hk_6: 0, mid_hk_7: 0.007143, mid_hk_8: 0, mid_hk_9: 0,
    mid_hk_created: 0.046429, mid_hk_used: 0.4, mid_base: 0.021429, mid_mineral: 0, mid_other: 0.332143,
  },
};

// Accuracy on the same held-out 20% of the 3,052 training games (stratified, random_state=42),
// as printed by each notebook. cv is the best 5-fold score of the hyperparameter search, when there was one.
export interface ModelResult {
  id: string;
  name: string;
  test: number;
  printed: string;
  cv?: number;
  cutoff: string;
  what: string;
}

export const MODELS: ModelResult[] = [
  {
    id: "rf-v1", name: "Random forest v1", test: 0.9444, printed: "Random Forest Test Accuracy: 94.44%",
    cv: 0.922165510074089, cutoff: "Actions up to 25 minutes (t1500)",
    what: "500 trees, log2 of the features tried at each split, no depth limit.",
  },
  {
    id: "voting", name: "Soft voting", test: 0.9378, printed: "Accuracy on test set: 0.9378",
    cutoff: "Actions up to 2000 s",
    what: "Averages the class probabilities of a random forest and XGBoost, then takes the most likely player.",
  },
  {
    id: "stacking", name: "Stacking", test: 0.9345335515548282, printed: "Stacked Model Test Accuracy: 0.9345335515548282",
    cutoff: "Actions up to 25 minutes (t1500)",
    what: "A logistic regression trained on the probabilities of the forest, XGBoost, logistic regression and SVM.",
  },
  {
    id: "svm", name: "SVM", test: 0.9165302782324058, printed: "Test Accuracy: 0.9165302782324058",
    cv: 0.8984033993764458, cutoff: "Actions up to 2000 s",
    what: "RBF kernel, C = 10, gamma = 0.01.",
  },
  {
    id: "rf-v0", name: "Random forest v0", test: 0.9161, printed: "Random Forest Test Accuracy: 91.61%",
    cv: 0.9015474294917549, cutoff: "Whole game, shortest and longest 2% of games removed",
    what: "The first feature set: early, mid and late phases split at 6 and 12 minutes, with hotkey updates counted too. Trees capped at depth 15.",
  },
  {
    id: "log-reg", name: "Logistic regression", test: 0.9132569558101473, printed: "Test Accuracy: 0.9132569558101473",
    cv: 0.8918443461061383, cutoff: "Actions up to 2000 s",
    what: "L1 penalty, C = 10, liblinear solver.",
  },
  {
    id: "xgb", name: "XGBoost", test: 0.8870703764320785, printed: "Test Accuracy: 0.8870703764320785",
    cv: 0.8775067886955649, cutoff: "Actions up to 2000 s",
    what: "200 boosted trees of depth 5, learning rate 0.2.",
  },
];
