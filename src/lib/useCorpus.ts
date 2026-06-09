import { useSyncExternalStore } from "react";
import { loadCorpus } from "./corpus";
import { subscribeWorkflow } from "./workflow-storage";
import type { Corpus } from "../models";

let snapshot: Corpus = loadCorpus();

function getSnapshot(): Corpus {
  return snapshot;
}

function subscribe(onStoreChange: () => void): () => void {
  return subscribeWorkflow(() => {
    snapshot = loadCorpus();
    onStoreChange();
  });
}

export function useCorpus(): Corpus {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
