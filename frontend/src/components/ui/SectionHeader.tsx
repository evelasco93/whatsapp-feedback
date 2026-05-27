import { ReactNode } from "react";

type SectionHeaderProps = {
  titulo: string;
  subtitulo?: string;
  accion?: ReactNode;
};

export const SectionHeader = ({
  titulo,
  subtitulo,
  accion,
}: SectionHeaderProps) => {
  return (
    <div className="section-header">
      <div>
        <h2>{titulo}</h2>
        {subtitulo ? <p>{subtitulo}</p> : null}
      </div>
      {accion ? <div>{accion}</div> : null}
    </div>
  );
};
