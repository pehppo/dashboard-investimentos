-- Novo tipo de transação: provento (dividendo/JCP recebido de renda variável).
-- Não altera a view `positions`: o CASE WHEN de quantidade/valor investido só
-- reconhece 'compra'/'venda'/'aporte'/'resgate' e cai no `else 0` para qualquer
-- outro tx_type, então proventos não afetam quantidade nem custo médio — só
-- precisam ser somados à parte nas telas que quiserem exibir o total recebido.
--
-- ALTER TYPE ... ADD VALUE não pode ser usado na mesma transação em que é
-- consumido (restrição do Postgres), por isso fica isolado no próprio arquivo.
alter type tx_type add value 'provento';
