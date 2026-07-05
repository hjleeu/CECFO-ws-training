import { Measure } from "./components/sheet/Measure";

export default function App() {
  return (
    <Measure
      chords={["G"]}
      notes={[
        { note: "1", char: "啊", pinyin:"a" },
        { note: "1", char: "啊", pinyin:"a" },
        { note: "1", char: "啊", pinyin:"a" },
        { note: "1", char: "啊", pinyin:"a" }
      ]}
    />
  );
}