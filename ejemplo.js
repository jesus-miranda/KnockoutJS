//Mensajes
function presentarMensajeToast(_tipo, _msg, _titulo) {
    var shortCutFunction = _tipo;
    var msg = _msg;
    var title = _titulo;

    toastr.options = {
        closeButton: true,
        debug: false,
        progressBar: true,
        positionClass: 'toast-top-right',
        onclick: function () {
            //alert('You can perform some custom action after a toast goes away');
        },
        showDuration: 800,
        hideDuration: 1300,
        timeOut: 7300,
        extendedTimeOut: 1300,
        showEasing: 'swing',
        hideEasing: 'linear',
        showMethod: 'fadeIn',
        hideMethod: 'fadeOut'
    };

    var $toast = toastr[shortCutFunction](msg, title);

    return true;
}

$(document).ready(function () {

    var ubicacionwegserv = "";
    if (sessionStorage.getItem("direccionurl"))
        ubicacionwegserv = sessionStorage.getItem("direccionurl") + "/CallCenterServices.asmx";
    else
        ubicacionwegserv = "/WebService/CallCenterServices.asmx";

    if (sessionStorage.getItem("UsuarioAct") == null) {
        window.location = "/Pages/AccesoRestringido";
        return;
    }

    var rescate = accesosusuario(1201);
    if (rescate == false) {
        alert("Su usuario no tiene permiso para esta opción...")
        window.location = "/Pages/AccesoRestringido";
        return;
    }

    var _idPedidoQuery = $("#IdPedido").val();

    $('#reloj').clockpicker();

    $('#calendario').datepicker({
        todayBtn: "linked",
        keyboardNavigation: false,
        forceParse: false,
        calendarWeeks: true,
        autoclose: true,
        startDate: new Date()
        //endDate: new Date(new Date() + 30),
        //daysOfWeekDisabled: [0, 6]
    });

    ko.extenders.required = function (target, overrideMessage) {
        //add some sub-observables to our observable
        target.hasError = ko.observable();
        target.validationMessage = ko.observable();

        //define a function to do validation
        function validate(newValue) {
            target.hasError(newValue ? false : true);
            target.validationMessage(newValue ? "" : overrideMessage || "**Campo obligatorio");
        }

        //initial validation
        validate(target());

        //validate whenever the value changes
        target.subscribe(validate);

        //return the original observable
        return target;
    };

    function MotivoViewModel(data) {
        var self = this;

        self.Id = ko.observable(data.Id);
        self.Descripcion = ko.observable(data.Descripcion);
        self.Valor = ko.observable(false);

        return self;
    }

    function ProductoViewModel(data) {
        var self = this;

        //Propiedades
        self.IdPedido = ko.observable(data.IdPedido);
        self.CodigoProducto = ko.observable(data.CodigoProducto);
        self.NombreProducto = ko.observable(data.NombreProducto);
        self.ComboProducto = ko.observable(data.ComboProducto);
        self.Cantidad = ko.observable(data.Cantidad);
        self.PVPUnitario = ko.observable(data.PVPUnitario);
        self.PVP = ko.observable(data.PVP);
        self.PrecioOfertaUnitario = ko.observable(data.PrecioOfertaUnitario);
        self.PrecioOferta = ko.observable(data.PrecioOferta);
        self.PrecioCredito = ko.observable(data.PrecioCredito);
        self.MinGanguitas = ko.observable(data.MinGanguitas);
        self.MaxGanguitas = ko.observable(data.MaxGanguitas);
        self.GanguitasDisponibles = ko.computed(function () {
            var cuotas = [];

            for (i = self.MinGanguitas() ; i <= self.MaxGanguitas() ; i++) {
                var cuota = { Codigo: i, Descripcion: i };

                if (i <= 24 || i == 30) {
                    cuotas.push(cuota);
                }
            }

            return cuotas;
        }, self);
        self.Ganguitas = ko.observable(data.Ganguitas);
        self.PrecioGanguita = ko.observable(data.PrecioGanguita);
        self.FormaPago = ko.observable(data.FormaPago);
        self.FactorUtilizado = ko.observable(0);
        self.EnableGanguitas = ko.observable(true);
        self.FormasDePago = ko.observableArray([{ Codigo: "D", Descripcion: "Crédito" },
                                                { Codigo: "T", Descripcion: "Tarjeta" },
                                                { Codigo: "C", Descripcion: "Contado" }]);
        self.PrecioCredito = ko.computed(function () {
            if (self.PrecioGanguita() != '' && self.Ganguitas() != '') {
                return self.PrecioGanguita() * self.Ganguitas() * self.Cantidad();
            }
            else {
                return 0.0;
            }
        }, self);
        self.PrecioFinal = ko.computed(function () {

            if (self.FormaPago() == 'D') {
                if (self.PrecioGanguita() != '' && self.Ganguitas() != '') {
                    return self.PrecioGanguita() * self.Ganguitas() * self.Cantidad();
                }
                else {
                    return 0.0;
                }
            } else {
                return self.PrecioOferta() * self.Cantidad();
            }

        }, self);
        self.PVPFormat = ko.computed(function () {
            return self.PVP().toFixed(2);
        }, self);
        self.PrecioOfertaFormat = ko.computed(function () {
            return self.PrecioOferta().toFixed(2);
        }, self);
        self.PrecioCreditoFormat = ko.computed(function () {
            return self.PrecioCredito() == '' ? '' : self.PrecioCredito().toFixed(2);
        }, self);
        self.PrecioGanguitaFormat = ko.computed(function () {
            return self.PrecioGanguita() == '' || self.PrecioGanguita() == null ? '' : self.PrecioGanguita().toFixed(2);
        }, self);
        self.PrecioFinalFormat = ko.computed(function () {
            return self.PrecioFinal() == '' ? '' : self.PrecioFinal().toFixed(2);
        }, self);

        //Eventos
        self.FormaPago.subscribe(function (nuevaFormaPago) {

            if (nuevaFormaPago == "D") {
                self.EnableGanguitas(true);
                self.CalcularGanguita();
            }
            else {
                self.EnableGanguitas(false);
                self.PrecioGanguita(0.00);
                self.Ganguitas(1);
            }

        });

        self.Ganguitas.subscribe(function () {
            if (self.FormaPago() == "D") {
                self.CalcularGanguita();
            }
        });

        self.Cantidad.subscribe(function () {
            if (self.FormaPago() == "D") {
                self.CalcularGanguita();
            }
        });

        //Funciones
        self.CalcularGanguita = function () {
            var Parametros = new Object();
            Parametros.CodigoProducto = self.CodigoProducto();
            Parametros.Capital = self.PVP(); //* self.Cantidad();
            Parametros.Plazo = self.Ganguitas();

            console.log(JSON.stringify(Parametros));

            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_ProductoCalcularCuota",
                data: JSON.stringify(Parametros),
                async: false,
                type: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: false,
                timeout: 24000,
                success: function (result) {
                    if (JSON.parse(result.d).ERROR)
                        alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                    else {
                        if (JSON.parse(result.d).Producto) {
                            var respuesta = JSON.parse(result.d).Producto[0];
                            console.log("Valor cuotita: " + respuesta.VALOR_CUOTA);
                            self.PrecioGanguita(respuesta.VALOR_CUOTA);
                            self.FactorUtilizado(respuesta.VALOR_FACTOR);
                        } else {
                            presentarMensajeToast("error", "Error, no existen datos al calcular cuota de producto. Reporte al administrador", "Error");
                        }
                    }
                },
                error: function (result) {
                    presentarMensajeToast("error", "Error del Sistema al calcular valor de cuota. Reporte al administrador", "Error");
                }
            });
        }

        return self;
    }

    function PreventaViewModel() {
        var self = this;

        //Parametrizacion
        self.ParametrizacionId = ko.observable("");
        self.ParametrizacionCampaña = ko.observable("");
        self.ParametrizacionDiasVencimiento = ko.observable("");
        self.ParametrizacionFechaInicio = ko.observable("");
        self.ParametrizacionFechaFin = ko.observable("");
        self.ParametrizacionEstado = ko.observable("");
        self.Iva = ko.observable("");
        self.IvaUno = ko.observable("");
        self.IvaCeroDif = ko.observable("");

        //Propiedades
        self.EnableDatos = ko.observable(true);
        self.EnableLineaProducto = ko.observable(true);
        self.EnableDatosEntrega = ko.observable(true);
        self.VisibleNoDesea = ko.observable(true);
        self.VisibleGuardar = ko.observable(true);
        self.IsInit = ko.observable(true);

        self.Id = ko.observable("");
        self.Usuario = ko.observable("");
        self.Pedido = ko.observable("");
        self.Identificacion = ko.observable("").extend({ required: "" });
        self.IdentificacionValidacion = ko.observable(false);
        self.Identificacion.focused = ko.observable();
        self.Identificacion.focused.subscribe(function (newValue) {
            if (!newValue) {
                self.ValidarCedulaBuro(true);
            }
        });
        self.Nombres = ko.observable("").extend({ required: "" });
        self.Email = ko.observable("");
        self.Region = ko.observable("");
        self.Provincia = ko.observable("").extend({ required: "" });
        self.ProvinciaDesc = ko.observable("");
        self.Provincias = ko.computed(function () {

            var ProvinciasEncontradas = [];

            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_Provincias",
                async: false,
                type: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: false,
                timeout: 24000,
                success: function (result) {
                    if (JSON.parse(result.d).ERROR)
                        alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                    else {
                        if (JSON.parse(result.d).Provincias) {
                            ProvinciasEncontradas = [];

                            ko.utils.arrayForEach(JSON.parse(result.d).Provincias, function (data) {
                                ProvinciasEncontradas.push(data);
                            });
                        }
                    }
                },
                error: function (result) {
                    presentarMensajeToast("error", "Error del Sistema al obtener provincias", "Error");
                }
            });

            return ProvinciasEncontradas;

        }, self);
        self.Ciudad = ko.observable("").extend({ required: "" });
        self.CiudadDesc = ko.observable("");
        self.Ciudades = ko.computed(function () {

            var CiudadesEncontradas = [];

            var Parametros = new Object();
            Parametros.Provincia = self.Provincia();

            if (self.Provincia() != "" && self.Provincia() != undefined && self.Provincia() != null) {

                $.ajax({
                    url: ubicacionwegserv + "/web_preventa_online_Ciudades",
                    async: false,
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: JSON.stringify(Parametros),
                    cache: false,
                    timeout: 24000,
                    success: function (result) {
                        if (JSON.parse(result.d).ERROR)
                            alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                        else {
                            if (JSON.parse(result.d).Ciudades) {
                                CiudadesEncontradas = [];

                                ko.utils.arrayForEach(JSON.parse(result.d).Ciudades, function (data) {
                                    CiudadesEncontradas.push(data);
                                });
                            }
                        }
                    },
                    error: function (result) {
                        presentarMensajeToast("error", "Error del Sistema al obtener ciudades", "Error");
                    }
                });

            }

            return CiudadesEncontradas;

        }, self);
        self.Direccion = ko.observable("").extend({ required: "" });
        self.DireccionEntrega = ko.observable("").extend({ required: "" });
        self.ReferenciaDireccion = ko.observable("").extend({ required: "" });
        self.TelefonoConvencional = ko.observable("");
        self.TelefonoCelular = ko.observable("");
        self.TelefonoLaboralNegocio = ko.observable("");
        self.Observacion = ko.observable("");
        self.FechaPedido = ko.observable("");
        self.Procesado = ko.observable("");
        self.Asignado = ko.observable("");
        self.Productos = ko.observableArray();
        self.FechaEntrega = ko.observable(new Date().toLocaleString('en-us').slice(0, 10)).extend({ required: "" });
        self.HoraEntrega = ko.observable("09:00").extend({ required: "" });
        self.SucursalFacturacion = ko.observable("").extend({ required: "" });
        self.Sucursales = ko.computed(function () {

            var SucursalesEncontradas = [];

            var Parametros = new Object();
            Parametros.provincia = self.Provincia();
            Parametros.ciudad = self.Ciudad();

            SucursalesEncontradas = [];
            //SucursalesEncontradas.push({ Codigo: "000", Descripcion: "BODEGA REGIONAL GUAYAQUIL" });
            //SucursalesEncontradas.push({ Codigo: "004", Descripcion: "BODEGA REGIONAL QUITO" });

            if (self.Provincia() != "" && self.Provincia() != undefined && self.Provincia() != null
                && self.Ciudad() != "" && self.Ciudad() != undefined && self.Ciudad() != null) {

                $.ajax({
                    url: ubicacionwegserv + "/web_preventa_online_Sucursales",
                    data: JSON.stringify(Parametros),
                    async: false,
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    cache: false,
                    timeout: 24000,
                    success: function (result) {
                        if (JSON.parse(result.d).ERROR) {
                            alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                        }
                        else {
                            if (JSON.parse(result.d).Sucursales) {
                                ko.utils.arrayForEach(JSON.parse(result.d).Sucursales, function (data) {
                                    SucursalesEncontradas.push(data);
                                });
                            }
                        }
                    },
                    error: function (result) {
                        presentarMensajeToast("error", "Error del Sistema al obtener sucursales", "Error");
                    }
                });

            }

            return SucursalesEncontradas;

        }, self);
        self.TiposEntrega = ko.observableArray();
        self.TipoEntrega = ko.observable("").extend({ required: "" });
        self.Motivos = ko.observableArray();
        self.MotivosSeleccionados = ko.computed(function () {
            return ko.utils.arrayFilter(self.Motivos(), function (motivo) {
                return motivo.Valor() == true;
            });
        }, self);
        self.ProductosEfectivo = ko.computed(function () {
            return ko.utils.arrayFilter(self.Productos(), function (producto) {
                return producto.FormaPago() == "C";
            });
        }, self);
        self.ProductosTarjeta = ko.computed(function () {
            return ko.utils.arrayFilter(self.Productos(), function (producto) {
                return producto.FormaPago() == "T";
            });
        }, self);
        self.ProductosCredito = ko.computed(function () {
            return ko.utils.arrayFilter(self.Productos(), function (producto) {
                return producto.FormaPago() == "D";
            });
        }, self);
        self.ProductosCreditoGanguitas = ko.computed(function () {
            var ganguitas = ko.utils.arrayMap(self.ProductosCredito(), function (item) { return item.Ganguitas() });
            return ko.utils.arrayGetDistinctValues(ganguitas).sort();
        }, self);
        self.TotalEfectivo = ko.computed(function () {
            return self.ProductosEfectivo().reduce(function (result, producto) {
                return result + (producto.PrecioOferta() * producto.Cantidad());
            }, 0.00);
        }, self);
        self.TotalTarjeta = ko.computed(function () {
            return self.ProductosTarjeta().reduce(function (result, producto) {
                return result + (producto.PrecioOferta() * producto.Cantidad());
            }, 0.00);
        }, self);
        self.TotalCredito = ko.computed(function () {
            return self.ProductosCredito().reduce(function (result, producto) {
                return result + producto.PrecioCredito();
            }, 0.00);
        }, self);
        self.TotalIva = ko.computed(function () {
            var TotalIva = 0;
            var IVA = self.Iva() / 100;

            TotalIva = TotalIva + self.ProductosEfectivo().reduce(function (result, producto) {
                return result + (producto.PrecioOferta() * producto.Cantidad());
            }, 0.00);
            TotalIva = TotalIva + self.ProductosTarjeta().reduce(function (result, producto) {
                return result + (producto.PrecioOferta() * producto.Cantidad());
            }, 0.00);

            return TotalIva * IVA;
        }, self);
        self.TotalVenta = ko.computed(function () {
            return parseFloat(self.TotalEfectivo()) + parseFloat(self.TotalTarjeta()) + parseFloat(self.TotalCredito()) + self.TotalIva();
        }, self);
        self.TotalEfectivoFormat = ko.computed(function () {
            return self.TotalEfectivo().toFixed(2);
        }, self);
        self.TotalTarjetaFormat = ko.computed(function () {
            return self.TotalTarjeta().toFixed(2);
        }, self);
        self.TotalCreditoFormat = ko.computed(function () {
            return self.TotalCredito().toFixed(2);
        }, self);
        self.TotalIvaFormat = ko.computed(function () {
            return self.TotalIva().toFixed(2);
        }, self);
        self.TotalVentaFormat = ko.computed(function () {
            return self.TotalVenta().toFixed(2);
        }, self);

        self.Tarjeta = ko.observable("");
        self.TarjetaDesc = ko.observable("");
        self.Tarjetas = ko.computed(function () {

            var TarjetasEncontradas = [];

            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_Tarjetas",
                async: false,
                type: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: false,
                timeout: 24000,
                success: function (result) {
                    if (JSON.parse(result.d).ERROR)
                        alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                    else {
                        if (JSON.parse(result.d).Tarjetas) {
                            TarjetasEncontradas = [];

                            ko.utils.arrayForEach(JSON.parse(result.d).Tarjetas, function (data) {
                                TarjetasEncontradas.push(data);
                            });
                        }
                    }
                },
                error: function (result) {
                    presentarMensajeToast("error", "Error del Sistema al obtener tarjetas", "Error");
                }
            });

            return TarjetasEncontradas;

        }, self);

        self.Plan = ko.observable("");
        self.PlanDesc = ko.observable("");
        self.Planes = ko.computed(function () {

            var PlanesEncontradas = [];

            var parametros = new Object();
            parametros.Tarjeta = self.Tarjeta();

            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_Planes",
                async: false,
                type: "POST",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(parametros),
                dataType: "json",
                cache: false,
                timeout: 24000,
                success: function (result) {
                    if (JSON.parse(result.d).ERROR)
                        alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                    else {
                        if (JSON.parse(result.d).Planes) {
                            PlanesEncontradas = [];

                            ko.utils.arrayForEach(JSON.parse(result.d).Planes, function (data) {
                                PlanesEncontradas.push(data);
                            });
                        }
                    }
                },
                error: function (result) {
                    presentarMensajeToast("error", "Error del Sistema al obtener planes", "Error");
                }
            });

            return PlanesEncontradas;

        }, self);

        self.PagoContarjetaCredito = ko.computed(function () {
            if (self.ProductosTarjeta().length > 0) {
                return true;
            } else {
                return false;
            }
        }, self);

        //Validaciones
        self.Validaciones = ko.computed(function () {
            if (self.Direccion() == "") {
                return "Debe ingresar Dirección";
            } else if (self.Provincia() == "") {
                return "Debe seleccionar una Provincia";
            } else if (self.Ciudad() == "") {
                return "Debe seleccionar una Ciudad";
            } else if (self.SucursalFacturacion() == "") {
                return "Debe seleccionar una Sucursal de Facturación";
            } else if (self.DireccionEntrega() == "") {
                return "Debe ingresar Dirección de Entrega";
            } else if (self.ReferenciaDireccion() == "") {
                return "Debe ingresar Referencia";
            } else if (self.TipoEntrega() == "") {
                return "Debe seleccionar Forma de Entrega";
            } else if (self.FechaEntrega() == "") {
                return "Debe ingresar Fecha de Entrega";
            } else if (self.HoraEntrega() == "") {
                return "Debe ingresar Hora de Entrega";
            } else if (self.SucursalFacturacion() == "") {
                return "Debe seleccionar Sucursal de Facturación";
            } else if (self.Nombres() == "") {
                return "Debe ingresar un Nombre para la Idntificación seleccionada";
            } else if (self.IdentificacionValidacion() == false) {
                return "Debe ingresar una Identificación válida, confirmar con el cliente la ingresada";
            } else {
                return "";
            }
        }, self);

        //Funciones
        self.GetParametrizacion = function () {
            var Parametros = new Object();
            Parametros.FechaCliente = new Date();

            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_Parametrizacion",
                data: JSON.stringify(Parametros),
                async: false,
                type: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: false,
                timeout: 24000,
                success: function (result) {
                    if (JSON.parse(result.d).ERROR)
                        alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                    else {
                        if (JSON.parse(result.d).Parametros) {
                            self.ParametrizacionId(JSON.parse(result.d).Parametros[0].Id);
                            self.ParametrizacionCampaña(JSON.parse(result.d).Parametros[0].Campaña);
                            self.ParametrizacionDiasVencimiento(JSON.parse(result.d).Parametros[0].DisasVencimiento);
                            self.ParametrizacionFechaInicio(JSON.parse(result.d).Parametros[0].FechaInicio);
                            self.ParametrizacionFechaFin(JSON.parse(result.d).Parametros[0].FechaFin);
                            self.ParametrizacionEstado(JSON.parse(result.d).Parametros[0].Estado);
                        }
                    }
                },
                error: function (result) {
                    presentarMensajeToast("error", "Error del Sistema al obtener parametrización", "Error");
                }
            });

            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_GetIVA",
                async: false,
                type: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: false,
                timeout: 24000,
                success: function (result) {
                    if (JSON.parse(result.d).ERROR)
                        alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                    else {
                        if (JSON.parse(result.d).IVA) {
                            self.Iva(JSON.parse(result.d).IVA[0].IVA);
                            self.IvaUno(JSON.parse(result.d).IVA[0].IVA_UNO);
                            self.IvaCeroDif(JSON.parse(result.d).IVA[0].IVA_CERO_DIF);
                        }
                    }
                },
                error: function (result) {
                    presentarMensajeToast("error", "Error del Sistema al obtener parametrización de iva. Contacte al administrador", "Error");
                }
            });
        }

        self.GetTiposEntrega = function () {
            $.ajax({
                url: ubicacionwegserv + "/web_preventa_TiposEntrega",
                async: false,
                type: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: false,
                timeout: 24000,
                success: function (result) {
                    if (JSON.parse(result.d).ERROR)
                        alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                    else {
                        if (JSON.parse(result.d).TiposEntrega) {

                            self.TiposEntrega.removeAll();
                            ko.utils.arrayForEach(JSON.parse(result.d).TiposEntrega, function (data) {
                                self.TiposEntrega.push(data);
                            });
                        }
                    }
                },
                error: function (result) {
                    presentarMensajeToast("error", "Error del Sistema al obtener Tipos Entrega", "Error");
                }
            });
        }

        self.GetMotivos = function () {
            $.ajax({
                url: ubicacionwegserv + "/web_preventa_Motivos",
                async: false,
                type: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: false,
                timeout: 24000,
                success: function (result) {
                    if (JSON.parse(result.d).ERROR)
                        alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                    else {
                        if (JSON.parse(result.d).Motivos) {

                            self.Motivos.removeAll();
                            ko.utils.arrayForEach(JSON.parse(result.d).Motivos, function (data) {
                                self.Motivos.push(new MotivoViewModel(data));
                            });
                        }
                    }
                },
                error: function (result) {
                    presentarMensajeToast("error", "Error del Sistema al obtener Motivos", "Error");
                }
            });
        }

        self.ValidarCedulaBuro = function (_mostrarSuccess) {

            var parametros = new Object();
            parametros.CedulaPersona = self.Identificacion();

            $.ajax({
                url: ubicacionwegserv + "/web_datos_BuscarCedula",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                async: false,
                dataType: 'json',
                data: JSON.stringify(parametros),
                success: function (result) {
                    if (JSON.parse(result.d).ERROR) {
                        alert("Mensaje: Error al validar cédula: " + JSON.parse(result.d).ERROR[0].errorMessage);
                    }
                    else {
                        if (JSON.parse(result.d).Cedula[0] != undefined && JSON.parse(result.d).Cedula[0] != null) {
                            var data = JSON.parse(result.d).Cedula[0];
                            self.Nombres(data.NOMBRES);
                            self.IdentificacionValidacion(true);

                            if (_mostrarSuccess) {
                                presentarMensajeToast("success", "Cédula validada correctamente", "Éxito");
                            }
                        }
                        else {
                            self.IdentificacionValidacion(false);
                            //alert("Mensaje: La cédula del pedido es inválida, confirmar con el cliente");
                            presentarMensajeToast("error", "La cédula del pedido es inválida, confirmar con el cliente", "Error");
                        }
                    }
                },
                error: function (result) {
                    self.IdentificacionValidacion(true);
                    presentarMensajeToast("error", "No se pudo validar cédula en datos de Registro Civil, confirmar con el cliente", "Error");
                }
            });

        }

        self.onEnterIdentificacion = function (d, e) {
            if (e.which == 13) {
                self.ValidarCedulaBuro(true);
                return true;
            } else {
                return true;
            }
        }

        self.GetPreventaOnline = function (_IdPreventaOnline) {

            if (self.ParametrizacionId() != "") {

                var Parametros = new Object();
                Parametros.Id = _IdPreventaOnline;

                if (_idPedidoQuery != "" && _idPedidoQuery != null && _idPedidoQuery != undefined) {

                    $.ajax({
                        url: ubicacionwegserv + "/web_preventa_online_Pedido",
                        data: JSON.stringify(Parametros),
                        async: false,
                        type: "POST",
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        cache: false,
                        timeout: 24000,
                        success: function (result) {
                            if (JSON.parse(result.d).ERROR)
                                alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                            else {
                                if (JSON.parse(result.d).Pedido[0]) {
                                    var data = JSON.parse(result.d).Pedido[0];

                                    self.Id(data.Id);
                                    self.Usuario(data.usuario);
                                    self.Pedido(data.pedido);
                                    self.Identificacion(data.Identificacion);
                                    self.Nombres(data.Nombres);
                                    self.Email(data.mail);
                                    self.Region(data.region);

                                    self.Provincia(data.Provincia);
                                    self.ProvinciaDesc(data.ProvinciaDesc);

                                    self.Ciudad(data.Ciudad);
                                    self.CiudadDesc(data.CiudadDesc);

                                    self.Direccion(data.direccion);
                                    self.ReferenciaDireccion(data.referenciadireccion);
                                    self.TelefonoConvencional(data.telefonoconvencional);
                                    self.TelefonoCelular(data.telefonocelular);
                                    self.TelefonoLaboralNegocio(data.telefonolaboralnegocio);
                                    self.Observacion(data.observacion);
                                    self.FechaPedido(data.FechaPedido);
                                    self.Procesado(data.Procesado);
                                    self.Asignado(data.Asignado);

                                    self.GetProductos(_idPedidoQuery);

                                    if (self.Procesado() != "" && self.Procesado() != null) {
                                        self.BloquearObjetos();
                                    }
                                } else {
                                    alert("Mensaje: No existe la preventa online seleccionada");
                                }
                            }
                        },
                        //error: function(xhr, status, error) {
                        //    alert(xhr.responseText);
                        //},
                        error: function (result) {
                            presentarMensajeToast("error", "Error del Sistema al cargar datos de preventa online", "Error");
                        }
                    });

                }

                self.GetTiposEntrega();
                self.GetMotivos();

            } else {
                alert("Mensaje: No existe campaña activa");
            }

        }

        self.GetProductos = function (_IdPreventaOnline) {
            var Parametros = new Object();
            Parametros.Id = _IdPreventaOnline;

            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_Pedido_Detalle",
                data: JSON.stringify(Parametros),
                async: false,
                type: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: false,
                timeout: 24000,
                success: function (result) {
                    if (JSON.parse(result.d).ERROR)
                        alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                    else {
                        if (JSON.parse(result.d).Productos) {
                            self.Productos.removeAll();

                            ko.utils.arrayForEach(JSON.parse(result.d).Productos, function (data) {
                                self.Productos.push(new ProductoViewModel(data));
                            });
                        }
                    }
                },
                error: function (result) {
                    presentarMensajeToast("error", "Error del Sistema al cargar productos de preventa", "Error");
                }
            });
        }

        self.ExistsProducto = function (_CodigoProducto) {
            var match = ko.utils.arrayFirst(self.Productos(), function (producto) {
                return producto.CodigoProducto() === _CodigoProducto;
            });

            if (match) {
                return true;
            } else { return false; }
        }

        self.AutocompleteConstructor = function () {
            $("#ProductoAutocomplete").autocomplete({
                source: function (request, response) {
                    $.ajax({
                        url: ubicacionwegserv + "/web_preventa_online_ProductosAutocomplete",
                        type: "POST",
                        dataType: "json",
                        data: JSON.stringify({ busqueda: request.term }),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        cache: false,
                        timeout: 24000,
                        success: function (data) {
                            response($.map(JSON.parse(data.d).Productos, function (item) {
                                return { label: item.ProductoCoincidencia, value: item.ProductoCoincidencia };
                            }))
                        },
                        error: function (data) {
                            presentarMensajeToast("error", "Error del Sistema al obtener autocompletar producto", "Error");
                        }
                    })
                },
                select: function (request, response) {
                    var arraySeleccionado = response.item.value.split("|");

                    $('#ProductoAutocomplete').val('');

                    if (!(self.ExistsProducto(arraySeleccionado[0].trim()))) {
                        $.ajax({
                            url: ubicacionwegserv + "/web_preventa_online_Producto",
                            type: "POST",
                            dataType: "json",
                            data: JSON.stringify({ CodigoProducto: arraySeleccionado[0].trim() }),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            cache: false,
                            timeout: 24000,
                            success: function (result) {

                                ko.utils.arrayForEach(JSON.parse(result.d).Producto, function (data) {
                                    self.Productos.push(new ProductoViewModel(data));
                                });

                            },
                            error: function (data) {
                                presentarMensajeToast("error", "Error del Sistema al seleccionar producto", "Error");
                            }
                        });
                    }
                    else {
                        presentarMensajeToast("warning", "El producto seleccionado ya existe en la lista", "Advertencia");
                    }

                    return false;
                },
                minLength: 3
            });
        }

        self.RemoverProducto = function (Producto) {

            self.Productos.remove(Producto);

            if (Producto.ComboProducto() != "" && Producto.ComboProducto() != null && Producto.ComboProducto() != undefined) {
                ko.utils.arrayForEach(self.Productos(), function (producto) {
                    if (producto.ComboProducto() != "" && producto.ComboProducto() != null && producto.ComboProducto() != undefined && producto.ComboProducto() == Producto.ComboProducto()) {
                        self.Productos.remove(producto);
                    }
                });
            }

        }

        self.Confirmacion = function () {
            var retVal = confirm("Está seguro que desea guardar la preventa registrada?");
            if (retVal == true) {
                return true;
            }
            else {
                return false;
            }
        }

        self.NuevoProceso = function () {
            window.location = "/VentaOnline/Index";
            return;
        }

        self.LlamarCRM = function (url) {
            console.log("CRM -> " + url);
            var win = window.open(url, '_blank');
            win.focus();
        }

        self.Guardar = function () {

            var gestionGuardado = false;

            if (self.Validaciones() == "") {
                if (self.Confirmacion()) {
                    var IdCabeceraVenta = "";
                    var RegionCabeceraVenta = "";
                    var cabeceraObjeto = {
                        Tipo: "NaN",
                        Usuarioregistro: JSON.parse(sessionStorage.getItem("UsuarioAct")).username,
                        Pedido: self.Pedido(),
                        Nombres: self.Nombres(),
                        Ciudad: self.Ciudad(),
                        CiudadDesc: '',
                        Provincia: self.Provincia(),
                        ProvinciaDesc: '',
                        Region: self.Region(),
                        Direccion: self.Direccion(),
                        DireccionEntrega: self.DireccionEntrega(),
                        Referencia: self.ReferenciaDireccion(),
                        TelefonoConvencional: self.TelefonoConvencional(),
                        TelefonoCelular: self.TelefonoCelular(),
                        TelefonoLaboral: self.TelefonoLaboralNegocio(),
                        Observacion: self.Observacion(),
                        CorreoElectronico: self.Email(),
                        Acepta: true,
                        SucursalFacturacion: self.SucursalFacturacion(),
                        CedulaCliente: self.Identificacion(),
                        FechaEntrega: self.FechaEntrega() + " " + self.HoraEntrega() + ":00",
                        IdCampaña: self.ParametrizacionId(),
                        Campaña: self.ParametrizacionCampaña(),
                        IdTipoEntrega: self.TipoEntrega(),
                        TipoEntrega: "",
                        Tarjeta: self.Tarjeta(),
                        Plan: self.Plan()
                    };

                    var parametrosCabecera = new Object();
                    parametrosCabecera.cabecera = JSON.stringify(cabeceraObjeto);

                    /*Grabar Cabecera*/
                    if (self.Productos().length > 0) {
                        $.ajax({
                            url: ubicacionwegserv + "/web_preventa_online_GuardarCabecera",
                            type: "POST",
                            dataType: "json",
                            data: JSON.stringify(parametrosCabecera),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            cache: false,
                            timeout: 24000,
                            async: false,
                            success: function (result) {
                                if (JSON.parse(result.d).ERROR) {
                                    alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                                }
                                else {
                                    if (JSON.parse(result.d).Cabecera) {
                                        IdCabeceraVenta = JSON.parse(result.d).Cabecera[0].ID;
                                        RegionCabeceraVenta = JSON.parse(result.d).Cabecera[0].REGION;

                                        if (IdCabeceraVenta == 0) {
                                            alert("Error: No se pudo registrar pedido de la venta");
                                        }
                                        else {
                                            ko.utils.arrayForEach(self.Productos(), function (producto) {
                                                var detalle = JSON.stringify({
                                                    IdCabecera: IdCabeceraVenta,
                                                    CodigoProducto: producto.CodigoProducto(),
                                                    NombreProducto: producto.NombreProducto(),
                                                    Combo: producto.ComboProducto() == null ? "" : producto.ComboProducto(),
                                                    Cantidad: producto.Cantidad(),
                                                    PVP: producto.PVP(),
                                                    PrecioOferta: producto.PrecioOferta(),
                                                    Ganguitas: producto.Ganguitas() == "" ? 0 : producto.Ganguitas(),
                                                    PrecioGanguita: producto.PrecioGanguita() == "" ? 0 : producto.PrecioGanguita(),
                                                    Factor: producto.FactorUtilizado() == "" ? 0 : producto.FactorUtilizado(),
                                                    Descuento: 0,
                                                    PrecioFinal: producto.FormaPago() == "D" ? producto.PrecioCredito() : producto.PrecioOferta(),
                                                    IdDescuento: 0,
                                                    DescuentoValor: 0,
                                                    DescuentoTipo: 0,
                                                    FormaPago: producto.FormaPago(),
                                                    Autorizacion: producto.FormaPago() == "D" ? false : true
                                                });

                                                var parametrosDetalle = new Object();
                                                parametrosDetalle.detalle = detalle;

                                                $.ajax({
                                                    url: ubicacionwegserv + "/web_preventa_online_GuardarDetalle",
                                                    type: "POST",
                                                    dataType: "json",
                                                    data: JSON.stringify(parametrosDetalle),
                                                    contentType: "application/json; charset=utf-8",
                                                    dataType: "json",
                                                    cache: false,
                                                    timeout: 24000,
                                                    async: false,
                                                    success: function (result) {
                                                        if (JSON.parse(result.d).ERROR)
                                                            alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                                                        else {
                                                            console.log('Detalle grabado exitosamente Producto: ' + JSON.parse(result.d).Detalle[0].PRODUCTO);
                                                        }
                                                    },
                                                    error: function (result) {
                                                        alert("Error: No se pudo grabar producto del pedido " + producto.CodigoProducto() + " " + producto.NombreProducto());
                                                    }
                                                });
                                            });

                                            gestionGuardado = true;
                                        }
                                    }
                                }
                            },
                            error: function (result) {
                                alert("Mensaje: Error del sistema al grabar cabecera del pedido");
                            }
                        });
                    } else {
                        presentarMensajeToast("error", "Debe seleccionar productos", "Error");
                    }
                    /*Grabar Cabecera*/

                    if (gestionGuardado == true) {
                        /*Cambiar estado de Pedido*/
                        $.ajax({
                            url: ubicacionwegserv + "/web_preventa_online_CambiaEstadoPedido",
                            type: "POST",
                            dataType: "json",
                            data: JSON.stringify({ idPedido: self.Pedido(), usuarioAsignado: JSON.parse(sessionStorage.getItem("UsuarioAct")).username }),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            cache: false,
                            timeout: 24000,
                            async: false,
                            success: function (result) {
                                if (JSON.parse(result.d).ERROR)
                                    alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                                else {
                                    console.log("Cambio de estado exitoso");
                                }
                            },
                            error: function (result) {
                                alert("Mensaje: Error del sistema al actualizar pedido gestionado");
                            }
                        });
                        /*Cambiar estado de Pedido*/

                        /*Enviar correo*/
                        //self.TipoEntrega() == 1 && 
                        if ((self.ProductosEfectivo().length > 0 || self.ProductosTarjeta().length > 0)) {

                            var tipoEmail = "";

                            if (self.ProductosEfectivo().length > 0) {
                                tipoEmail = "C";
                            } else if (self.ProductosTarjeta().length > 0) {
                                tipoEmail = "T";
                            }

                            $.ajax({
                                url: ubicacionwegserv + "/web_preventa_online_EnvioMail",
                                type: "POST",
                                dataType: "json",
                                data: JSON.stringify({ _idPreventa: IdCabeceraVenta, _formaPago: tipoEmail }),
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                cache: false,
                                timeout: 24000,
                                async: false,
                                success: function (result) {
                                    if (JSON.parse(result.d).ERROR)
                                        alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                                    else {
                                        presentarMensajeToast("info", "Correo enviado exitosamente", "Información");
                                    }
                                },
                                error: function (result) {
                                    presentarMensajeToast("error", "Error del sistema al enviar email", "Error");
                                }
                            });

                        }
                        /*Enviar correo*/

                        /*Llamada a CRM*/
                        if (self.ProductosCredito().length > 0) {

                            var Url = "";

                            if (RegionCabeceraVenta == "01") {
                                Url += "http://9.0.1.162/tasklist/inicio.html?empresa=001&sucursal=422";
                            } else {
                                Url += "http://9.0.22.87/tasklist/inicio.html?empresa=001&sucursal=423";
                            }

                            Url += "&id=" + self.Identificacion();
                            Url += "&tipo=C";
                            Url += "&vend=" + JSON.parse(sessionStorage.getItem("UsuarioAct")).username;
                            Url += "&IdCotizacion=" + IdCabeceraVenta;
                            Url += "&TipoFinanciamiento=W";
                            Url += "&ValorCuota=0";
                            Url += "&CupoUtilizado=0";
                            Url += "&Meses=0";
                            Url += "&ValorCuotaProd=0";
                            Url += "&tipo_cliente=D";
                            Url += "&CuotaInical=0";
                            Url += "&MontoFinanciar=0";
                            Url += "&Adjunta_Cotizacion=NO";
                            Url += "&Variable_Cotizacion=";

                            self.LlamarCRM(Url);
                        }
                        /*Llamada a CRM*/

                        presentarMensajeToast("success", "Venta registrada exitosamente", "Exito");

                        self.BloquearObjetos();
                    }
                }
            }
            else {
                alert(self.Validaciones());
            }

        }

        self.GuardarNoAcepta = function () {

            if (self.IdentificacionValidacion() == false) {
                presentarMensajeToast("error", "Debe ingresar una Identificación válida, confirmar con el cliente la ingresada", "Error");
            } else {

                if (self.Confirmacion()) {
                    var cabeceraObjeto = {
                        Tipo: "CN",
                        Usuarioregistro: JSON.parse(sessionStorage.getItem("UsuarioAct")).username,
                        Pedido: self.Pedido() == null ? '' : self.Pedido(),
                        Nombres: self.Nombres() == null ? '' : self.Nombres(),
                        Ciudad: self.Ciudad() == null ? '' : self.Ciudad(),
                        CiudadDesc: '',
                        Provincia: self.Provincia() == null ? '' : self.Provincia(),
                        ProvinciaDesc: '',
                        Region: self.Region(),
                        Direccion: self.Direccion() == null ? '' : self.Direccion(),
                        DireccionEntrega: self.DireccionEntrega() == null ? '' : self.DireccionEntrega(),
                        Referencia: self.ReferenciaDireccion(),
                        TelefonoConvencional: self.TelefonoConvencional(),
                        TelefonoCelular: self.TelefonoCelular(),
                        TelefonoLaboral: self.TelefonoLaboralNegocio(),
                        Observacion: self.Observacion(),
                        CorreoElectronico: self.Email(),
                        Acepta: false,
                        SucursalFacturacion: self.SucursalFacturacion() == null ? '' : self.SucursalFacturacion(),
                        CedulaCliente: self.Identificacion(),
                        FechaEntrega: self.FechaEntrega() + " " + self.HoraEntrega() + ":00",
                        IdCampaña: self.ParametrizacionId(),
                        Campaña: self.ParametrizacionCampaña(),
                        IdTipoEntrega: self.TipoEntrega(),
                        TipoEntrega: "",
                        Tarjeta: self.Tarjeta(),
                        Plan: self.Plan()
                    };

                    $.ajax({
                        url: ubicacionwegserv + "/web_preventa_online_GuardarCabecera",
                        type: "POST",
                        dataType: "json",
                        data: JSON.stringify({ cabecera: JSON.stringify(cabeceraObjeto) }),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        cache: false,
                        timeout: 24000,
                        async: false,
                        success: function (result) {
                            if (JSON.parse(result.d).ERROR)
                                alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                            else {
                                if (JSON.parse(result.d).Cabecera) {
                                    var IdCabeceraVenta = JSON.parse(result.d).Cabecera[0].ID;

                                    if (IdCabeceraVenta == 0) {
                                        alert("Mensaje: Registro no grabado, no se pudo grabar cabecera");
                                    }
                                    else {
                                        ko.utils.arrayForEach(self.MotivosSeleccionados(), function (motivo) {
                                            var parametrosMotivo = new Object();
                                            parametrosMotivo.IdPreventa = IdCabeceraVenta;
                                            parametrosMotivo.IdMotivo = motivo.Id();

                                            $.ajax({
                                                url: ubicacionwegserv + "/web_preventa_online_GrabarMotivo",
                                                type: "POST",
                                                dataType: "json",
                                                data: JSON.stringify(parametrosMotivo),
                                                contentType: "application/json; charset=utf-8",
                                                dataType: "json",
                                                cache: false,
                                                timeout: 24000,
                                                success: function (result) {
                                                    if (JSON.parse(result.d).ERROR)
                                                        alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                                                    else {
                                                        console.log('Motivo grabado exitosamente');
                                                    }
                                                },
                                                error: function (result) {
                                                    alert("Mensaje: Error del sistema al grabar motivo");
                                                }
                                            });
                                        });

                                        /*Cambiar estado de Pedido*/
                                        $.ajax({
                                            url: ubicacionwegserv + "/web_preventa_online_CambiaEstadoPedido",
                                            type: "POST",
                                            dataType: "json",
                                            data: JSON.stringify({ idPedido: self.Pedido(), usuarioAsignado: JSON.parse(sessionStorage.getItem("UsuarioAct")).username }),
                                            contentType: "application/json; charset=utf-8",
                                            dataType: "json",
                                            cache: false,
                                            timeout: 24000,
                                            success: function (result) {
                                                if (JSON.parse(result.d).ERROR)
                                                    alert("Mensaje: " + JSON.parse(result.d).ERROR[0].errorMessage);
                                                else {
                                                    console.log("Cambio de estado exitoso");
                                                }
                                            },
                                            error: function (result) {
                                                alert("Mensaje: Error del sistema al actualizar pedido gestionado");
                                            }
                                        });
                                        /*Cambiar estado de Pedido*/

                                        //$('#myModal5').modal('toggle');
                                        //$('#myModal5').modal('show');
                                        $('#myModal5').modal('hide');

                                        alert("Mensaje: Registro grabado exitosamente");

                                        self.NuevoProceso();
                                    }
                                }
                            }
                        },
                        error: function (result) {
                            alert("Mensaje: Error del sistema al grabar cabecera");
                        }
                    });
                }

            }

        }

        //Eventos
        self.TipoEntrega.subscribe(function (_tipoEntrega) {

            if (self.Procesado() == null || self.Procesado() == "") {

                if (_tipoEntrega == "1") { //a domicilio
                    //console.log("se desactiva fecha y hora de entrega");
                    self.EnableDatosEntrega(true);
                } else if (_tipoEntrega == "2") { //se acerca a sucursal
                    //console.log("se activa fecha y hora de entrega");
                    self.EnableDatosEntrega(false);
                } else {
                    //console.log("se activa fecha y hora de entrega");
                    self.EnableDatosEntrega(true);
                }

            }

        });

        //Propiedades DOM
        self.EnableGuardar = ko.computed(function () {
            return self.Productos().length > 0 ? true : false;
        }, self);

        self.EnableGuardarNoAcepta = ko.computed(function () {
            if (self.MotivosSeleccionados().length > 0)
                return true;
            else
                return false;
        }, self);

        self.BloquearObjetos = function () {
            self.VisibleNoDesea(false);
            self.VisibleGuardar(false);
            self.EnableLineaProducto(false);
            self.EnableDatos(false);
            self.EnableDatosEntrega(false);

            ko.utils.arrayForEach(self.Productos(), function (producto) {
                producto.EnableGanguitas(false);
            });
        }

        //Inicializadores
        self.AutocompleteConstructor();

        self.GetParametrizacion();

        self.GetPreventaOnline(_idPedidoQuery);

        self.ValidarCedulaBuro(false);

        self.IsInit(false);

        return self;
    }

    ko.applyBindings(new PreventaViewModel());

});
