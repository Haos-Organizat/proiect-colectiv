from dataclasses import dataclass
from typing import Any


@dataclass
class Eveniment:
    id: int | None
    titlu: str
    descriere: str
    categorie: str
    data_ora: str
    loc: str
    numar_locuri: int
    organizatie_id: int | None
    creator_id: int | None
    status: str = "activ"
    poza: str | None = None

    @property
    def locuri(self) -> int:
        return self.numar_locuri

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "titlu": self.titlu,
            "descriere": self.descriere,
            "categorie": self.categorie,
            "data_ora": self.data_ora,
            "loc": self.loc,
            "locuri": self.numar_locuri,
            "numar_locuri": self.numar_locuri,
            "poza": self.poza,
            "organizatie_id": self.organizatie_id,
            "creator_id": self.creator_id,
            "status": self.status,
        }
