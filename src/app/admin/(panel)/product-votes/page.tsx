'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar } from 'lucide-react';

interface VoteData {
  title: string;
  count: number;
  voters: string[];
}

export default function ProductVotesPage() {
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      const response = await fetch('/api/product-votes');
      const data = await response.json();
      setVotes(data.votes || []);
    } catch (error) {
      console.error('Error fetching votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);
  const uniqueVoters = new Set(votes.flatMap(v => v.voters)).size;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
          Productos que Llegan Pronto
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Productos más votados por los clientes
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
          padding: '24px',
          borderRadius: '16px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(236, 72, 153, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <TrendingUp size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Total de Votos</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700' }}>{totalVotes}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
          padding: '24px',
          borderRadius: '16px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(244, 114, 182, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Users size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Votantes Únicos</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700' }}>{uniqueVoters}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          padding: '24px',
          borderRadius: '16px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Calendar size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Productos</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700' }}>{votes.length}</div>
        </div>
      </div>

      {/* Votes Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
            Ranking de Productos
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Cargando...
          </div>
        ) : votes.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No hay votos registrados aún
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    #
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Producto
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Votos
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Votantes
                  </th>
                </tr>
              </thead>
              <tbody>
                {votes.map((vote, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: idx < 3 ? 'linear-gradient(135deg, #ec4899, #db2777)' : '#f3f4f6',
                        color: idx < 3 ? 'white' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '14px'
                      }}>
                        {idx + 1}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                        {vote.title}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(219, 39, 119, 0.1))',
                        borderRadius: '8px',
                        color: '#db2777',
                        fontWeight: '700',
                        fontSize: '14px'
                      }}>
                        {vote.count}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {vote.voters.slice(0, 3).join(', ')}
                        {vote.voters.length > 3 && ` +${vote.voters.length - 3} más`}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
