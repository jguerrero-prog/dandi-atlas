/** Who made the atlas and where its data comes from, shown from the status bar. */
export function Credits() {
  return (
    <div className="atlas-credits">
      <p>
        Created by{" "}
        <a href="https://catalystneuro.com" target="_blank" rel="noreferrer">
          CatalystNeuro
        </a>
        , with data from the{" "}
        <a href="https://dandiarchive.org" target="_blank" rel="noreferrer">
          DANDI Archive
        </a>
        .
      </p>
      <p>
        Region meshes come from each atlas's publishers. The 3D view names the
        active atlas and links to it.
      </p>
    </div>
  );
}
