// ============================================================================
// PÁGINA DE PRUEBA DE CONEXIÓN A SUPABASE
// ============================================================================
// Esta página verifica que la conexión a Supabase esté funcionando
// Acceder desde: http://localhost:5173/supabase-test
// ============================================================================

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
}

export default function SupabaseTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: TestResult[] = [];

    // Test 1: Verificar variables de entorno
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      results.push({
        name: 'Variables de Entorno',
        status: 'error',
        message: 'Las variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están configuradas en .env.local',
      });
      setTests(results);
      setLoading(false);
      return;
    }

    results.push({
      name: 'Variables de Entorno',
      status: 'success',
      message: `URL: ${supabaseUrl}`,
    });

    // Test 2: Verificar configuración
    if (!isSupabaseConfigured()) {
      results.push({
        name: 'Configuración de Supabase',
        status: 'error',
        message: 'Supabase no está configurado correctamente',
      });
      setTests(results);
      setLoading(false);
      return;
    }

    results.push({
      name: 'Configuración de Supabase',
      status: 'success',
      message: 'Cliente de Supabase inicializado correctamente',
    });

    // Test 3: Probar conexión a la base de datos
    try {
      results.push({
        name: 'Conexión a Base de Datos',
        status: 'pending',
        message: 'Probando conexión...',
      });
      setTests([...results]);

      const { data, error } = await supabase
        .from('threats')
        .select('count')
        .limit(1);

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          results[results.length - 1] = {
            name: 'Conexión a Base de Datos',
            status: 'warning',
            message: 'Conexión exitosa pero las tablas no están creadas. Ejecuta las migraciones.',
          };
        } else {
          results[results.length - 1] = {
            name: 'Conexión a Base de Datos',
            status: 'error',
            message: `Error: ${error.message}`,
          };
        }
      } else {
        results[results.length - 1] = {
          name: 'Conexión a Base de Datos',
          status: 'success',
          message: 'Conexión exitosa y tablas encontradas',
        };
      }
    } catch (err) {
      results[results.length - 1] = {
        name: 'Conexión a Base de Datos',
        status: 'error',
        message: `Error: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      };
    }

    // Test 4: Verificar autenticación
    try {
      results.push({
        name: 'Sistema de Autenticación',
        status: 'pending',
        message: 'Verificando...',
      });
      setTests([...results]);

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        results[results.length - 1] = {
          name: 'Sistema de Autenticación',
          status: 'error',
          message: `Error: ${error.message}`,
        };
      } else if (session) {
        results[results.length - 1] = {
          name: 'Sistema de Autenticación',
          status: 'success',
          message: `Usuario autenticado: ${session.user?.email}`,
        };
      } else {
        results[results.length - 1] = {
          name: 'Sistema de Autenticación',
          status: 'success',
          message: 'Sistema de autenticación funcionando (sin sesión activa)',
        };
      }
    } catch (err) {
      results[results.length - 1] = {
        name: 'Sistema de Autenticación',
        status: 'error',
        message: `Error: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      };
    }

    // Test 5: Verificar Storage
    try {
      results.push({
        name: 'Storage',
        status: 'pending',
        message: 'Verificando buckets...',
      });
      setTests([...results]);

      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        results[results.length - 1] = {
          name: 'Storage',
          status: 'error',
          message: `Error: ${error.message}`,
        };
      } else if (buckets && buckets.length > 0) {
        results[results.length - 1] = {
          name: 'Storage',
          status: 'success',
          message: `${buckets.length} buckets encontrados: ${buckets.map(b => b.name).join(', ')}`,
        };
      } else {
        results[results.length - 1] = {
          name: 'Storage',
          status: 'warning',
          message: 'No se encontraron buckets. Ejecuta la migración 002.',
        };
      }
    } catch (err) {
      results[results.length - 1] = {
        name: 'Storage',
        status: 'error',
        message: `Error: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      };
    }

    setTests(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'outline',
      pending: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status === 'success' && '✓ Éxito'}
        {status === 'error' && '✗ Error'}
        {status === 'warning' && '⚠ Advertencia'}
        {status === 'pending' && 'Probando...'}
      </Badge>
    );
  };

  const allSuccess = tests.length > 0 && tests.every(t => t.status === 'success');
  const hasErrors = tests.some(t => t.status === 'error');

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            🧪 Prueba de Conexión a Supabase
          </CardTitle>
          <CardDescription>
            Verificación de la configuración y conexión con Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Resumen */}
            {!loading && tests.length > 0 && (
              <div className={`p-4 rounded-lg border ${
                allSuccess ? 'bg-green-50 border-green-200' :
                hasErrors ? 'bg-red-50 border-red-200' :
                'bg-yellow-50 border-yellow-200'
              }`}>
                <p className="font-semibold">
                  {allSuccess && '🎉 ¡Todas las pruebas pasaron exitosamente!'}
                  {hasErrors && '❌ Algunas pruebas fallaron'}
                  {!allSuccess && !hasErrors && '⚠️ Algunas advertencias encontradas'}
                </p>
              </div>
            )}

            {/* Resultados de las pruebas */}
            <div className="space-y-3">
              {tests.map((test, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card"
                >
                  <div className="mt-0.5">
                    {getStatusIcon(test.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium">{test.name}</h3>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{test.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón para volver a ejecutar */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={runTests}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ejecutando pruebas...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Ejecutar pruebas nuevamente
                  </>
                )}
              </Button>
            </div>

            {/* Información adicional */}
            <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
              <h4 className="font-semibold mb-2">📚 Recursos Útiles:</h4>
              <ul className="space-y-1 ml-4 list-disc">
                <li>
                  <a
                    href="/docs/supabase-setup.md"
                    className="text-primary hover:underline"
                  >
                    Guía de configuración de Supabase
                  </a>
                </li>
                <li>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Dashboard de Supabase
                  </a>
                </li>
                <li>
                  Variables de entorno configuradas en <code>.env.local</code>
                </li>
                <li>
                  Migraciones de base de datos en <code>supabase/migrations/</code>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
