// Tablas de tallas (medidas de referencia en centímetros)
import { Fragment } from 'react';

const TABLES = [
    {
        title: 'Camisas, camisetas y conjuntos',
        head: ['Talla', 'Pecho', 'Cintura', 'Cadera'],
        rows: [
            ['XS', '82–86', '66–70', '88–92'],
            ['S', '87–92', '71–76', '93–97'],
            ['M', '93–98', '77–82', '98–102'],
            ['L', '99–104', '83–88', '103–107'],
            ['XL', '105–110', '89–95', '108–112'],
            ['XXL', '111–117', '96–103', '113–118']
        ]
    },
    {
        title: 'Pantalones y jeans',
        head: ['Talla', 'Cintura', 'Cadera'],
        rows: [
            ['24', '61–63', '84–86'],
            ['26', '66–68', '89–91'],
            ['28', '71–73', '94–96'],
            ['30', '76–78', '99–101'],
            ['32', '81–83', '104–106'],
            ['34', '86–88', '109–111'],
            ['36', '91–93', '114–116']
        ]
    },
    {
        title: 'Zapatos',
        head: ['Talla', 'Largo del pie'],
        rows: [['35', '22,5'], ['36', '23'], ['37', '23,5'], ['38', '24,5'], ['39', '25'], ['40', '25,5'], ['41', '26,5'], ['42', '27'], ['43', '27,5']]
    }
];

export default function TablasTallas() {
    return TABLES.map((table) => (
        <Fragment key={table.title}>
            <h4>{table.title}</h4>
            <div className="table-scroll">
                <table className="size-table">
                    <thead>
                        <tr>{table.head.map((h) => <th scope="col" key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {table.rows.map(([size, ...cells]) => (
                            <tr key={size}>
                                <th scope="row">{size}</th>
                                {cells.map((c, i) => <td key={i}>{c}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Fragment>
    ));
}
