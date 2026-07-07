import './seam.css';

export function PourSeam() {
  return (
    <>
      <div className="seam" data-seam aria-hidden="true" />
      <div className="seam-tip" data-seam-tip aria-hidden="true" />
    </>
  );
}
