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

    var rescate = accesosusuario(1203);
    if (rescate == false) {
        alert("Su usuario no tiene permiso para esta opción...")
        window.location = "/Pages/AccesoRestringido";
        return;
    }

    $('#FechaInicio').datepicker({
        todayBtn: "linked",
        keyboardNavigation: false,
        forceParse: false,
        calendarWeeks: true,
        autoclose: true
    });

    $('#FechaFin').datepicker({
        todayBtn: "linked",
        keyboardNavigation: false,
        forceParse: false,
        calendarWeeks: true,
        autoclose: true
    });

    function PreventaDetalladaViewModel(data, detalles, motivos) {
        var self = this;

        self.Id = ko.observable(data.Id);
        self.FechaRegistro = ko.observable(data.FechaRegistro);
        self.UsuarioRegistro = ko.observable(data.UsuarioRegistro);
        self.Pedido = ko.observable(data.Pedido);
        self.CedulaCliente = ko.observable(data.CedulaCliente);
        self.Nombres = ko.observable(data.Nombres);
        self.Ciudad = ko.observable(data.Ciudad);
        self.CiudadDesc = ko.observable(data.CiudadDesc);
        self.Provincia = ko.observable(data.Provincia);
        self.ProvinciaDesc = ko.observable(data.ProvinciaDesc);
        self.Direccion = ko.observable(data.Direccion);
        self.DireccionEntrega = ko.observable(data.DireccionEntrega);
        self.Referencia = ko.observable(data.Referencia);
        self.TelefonoConvencional = ko.observable(data.TelefonoConvencional);
        self.TelefonoCelular = ko.observable(data.TelefonoCelular);
        self.TelefonoLaboral = ko.observable(data.TelefonoLaboral);
        self.CorreoElectronico = ko.observable(data.CorreoElectronico);
        self.Observacion = ko.observable(data.Observacion);
        self.Acepta = ko.observable(data.Acepta);
        self.AceptaDesc = ko.observable(data.AceptaDesc);
        self.SucursalFacturacion = ko.observable(data.SucursalFacturacion);
        self.SucursalFacturacionDesc = ko.observable(data.SucursalFacturacionDesc);
        self.FechaEntrega = ko.observable(data.FechaEntrega);
        self.FechaVencimiento = ko.observable(data.FechaVencimiento);
        self.IdCampaña = ko.observable(data.IdCampaña);
        self.Campaña = ko.observable(data.Campaña);
        self.IdTipoEntrega = ko.observable(data.IdTipoEntrega);
        self.TipoEntrega = ko.observable(data.TipoEntrega);

        //self.NotificacionCredito = ko.observable(data.NotificacionCredito);
        //self.Reaperturada = ko.observable(data.Reaperturada);

        self.Productos = ko.observableArray(detalles);

        self.Motivos = ko.observableArray(motivos);

        self.NotificarAprobacionCredito = ko.computed(function () {

            var respuesta = false;

            //if (self.IdTipoEntrega() == 1) 
            {

                ko.utils.arrayForEach(self.Productos(), function (producto) {

                    console.log(producto.FormaPago + " " + producto.Autorizacion + " " + producto.Seq_Compte_FAC + " " + producto.NotificacionCredito);

                    if (producto.FormaPago == "D" &&
                        producto.Autorizacion == true &&
                        (producto.Seq_Compte_FAC == "" || producto.Seq_Compte_FAC == null) &&
                        (producto.NotificacionCredito == "" || producto.NotificacionCredito == null)) {
                        respuesta = true;
                        return;
                    }
                });

            }

            return respuesta;

        }, self);

        self.ReaperturarGestion = ko.computed(function () {

            var respuesta = false;

            //ko.utils.arrayForEach(self.Productos(), function (producto) {
            //    if (producto.FormaPago == "D" && producto.Autorizacion == false &&
            //        (producto.Reaperturada == "" || producto.Reaperturada == null)) {
            //        respuesta = true;
            //        return;
            //    }
            //});

            return respuesta;

        }, self);

        self.NotificarBodega = function () {
            var parametros = new Object();
            parametros._idPreventa = self.Id();
            parametros._formaPago = "D";

            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_EnvioMail",
                data: JSON.stringify(parametros),
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
                        presentarMensajeToast("info", "Correo electrónico enviado correctamente", "Éxito");

                        $.ajax({
                            url: ubicacionwegserv + "/web_datos_RegistrarNotificacion",
                            data: JSON.stringify({ Id: self.Id() }),
                            async: false,
                            type: "POST",
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            cache: false,
                            timeout: 24000,
                            success: function (result) {

                            },
                            error: function (result) {
                                presentarMensajeToast("error", "Se presentó novedad al registrar notificación, notifique a soporte", "Error");
                            }
                        });
                    }
                },
                error: function (result) {
                    presentarMensajeToast("error", "Se presentó novedad al enviar correo electrónico de notificación, favor intente nuevamente o notifique a soporte", "Error");
                }
            });
        }

        self.ReaperturarVenta = function () {
            //
        }

        return self;
    }

    function PreventaOnlineViewModel(data) {
        var self = this;

        self.Id = ko.observable(data.Id);
        self.Pedido = ko.observable(data.Pedido);
        self.CedulaCliente = ko.observable(data.CedulaCliente);
        self.Nombres = ko.observable(data.Nombres);
        self.CiudadDesc = ko.observable(data.CiudadDesc);
        self.ProvinciaDesc = ko.observable(data.ProvinciaDesc);
        self.FechaRegistro = ko.observable(data.FechaRegistro);
        self.UsuarioRegistro = ko.observable(data.UsuarioRegistro);

        return self;
    }

    function HistorialViewModel() {
        var self = this;

        //Parametros Busqueda
        self.P_Pedido = ko.observable("");
        self.P_FechaInicio = ko.observable("");
        self.P_FechaFin = ko.observable("");
        self.P_Cedula = ko.observable("");
        self.P_Campana = ko.observable("");
        self.P_Usuario = ko.observable("");

        self.Campañas = ko.observableArray();

        //Propiedades
        self.Venta = ko.observable();
        self.Ventas = ko.observableArray();

        //Funciones
        self.CargarCampañas = function () {
            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_Campanas",
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
                        if (JSON.parse(result.d).Campanas) {
                            self.Campañas.removeAll();
                            ko.utils.arrayForEach(JSON.parse(result.d).Campanas, function (data) {
                                self.Campañas.push(data);
                            });
                        }
                    }
                },
                error: function (result) {
                    alert("Mensaje: Error del Sistema al obtener ventas");
                },
                complete: function (result) {
                }
            });
        }

        self.Validaciones = function () {
            if (self.P_FechaInicio() == "" || self.P_FechaFin() == "") {
                return "Parámetros Fecha de Inicio y Fin son obligatorios";
            } else if (self.P_FechaInicio() == self.P_FechaFin()) {
                return "Parámetros Fecha de Inicio y Fin no pueden ser iguales";
            }
            else {
                return "";
            }
        }

        self.BuscarVentas = function () {
            if (self.Validaciones() == "") {

                var parametros = new Object();
                parametros.Pedido = self.P_Pedido();
                parametros.FechaInicio = self.P_FechaInicio();
                parametros.FechaFin = self.P_FechaFin();
                parametros.Cedula = self.P_Cedula();
                parametros.Campana = self.P_Campana();
                parametros.Usuario = self.P_Usuario();

                self.Ventas.removeAll();

                $.ajax({
                    url: ubicacionwegserv + "/web_preventa_online_Ventas",
                    data: JSON.stringify(parametros),
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
                            if (JSON.parse(result.d).Ventas) {
                                ko.utils.arrayForEach(JSON.parse(result.d).Ventas, function (data) {
                                    self.Ventas.push(new PreventaOnlineViewModel(data));
                                });
                            } else {
                                alert("Mensaje: No existen datos para la consulta");
                            }
                        }
                    },
                    error: function (result) {
                        alert("Mensaje: Error del Sistema al obtener ventas");
                    }
                });

            } else {
                alert(self.Validaciones());
            }
        }

        self.CargarVenta = function (Venta) {
            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_Venta",
                data: JSON.stringify({ Id: Venta.Id() }),
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
                        if (JSON.parse(result.d).Table) {
                            var data = JSON.parse(result.d).Table[0];
                            var detalles = JSON.parse(result.d).Table1;
                            var motivos = JSON.parse(result.d).Table2;
                            self.Venta(new PreventaDetalladaViewModel(data, detalles, motivos));

                            //$('#myModal').modal('toggle');
                            $('#myModal').modal('show');
                            //$('#myModal').modal('hide');
                        } else {
                            alert("Mensaje: No existen datos para la consulta");
                        }
                    }
                },
                error: function (result) {
                    alert("Mensaje: Error del Sistema al obtener ventas");
                }
            });
        }

        self.CerrarModal = function () {
            //$('#myModal').modal('toggle');
            //$('#myModal').modal('show');
            $('#myModal').modal('hide');
        }

        //Inicializadores
        self.CargarCampañas();

        return self;
    }

    var viewModel = new HistorialViewModel();
    ko.applyBindings(viewModel);

    //$("#datatables-VentasOnline").datatable({
    //    dom: '<"html5buttons"b>ltfgitp',
    //    buttons: [
    //        { extend: 'copy' },
    //        { extend: 'csv' },
    //        { extend: 'excel', title: 'pedidoscliente' },
    //        { extend: 'pdf', title: 'pedidoscliente' },
    //        {
    //            extend: 'print',
    //            customize: function (win) {
    //                $(win.document.body).addclass('white-bg');
    //                $(win.document.body).css('font-size', '10px');
    //                $(win.document.body).find('table').addclass('compact').css('font-size', 'inherit');
    //            }
    //        }
    //    ],
    //    language: {
    //        "sprocessing": "procesando...",
    //        "slengthmenu": "mostrar _menu_ registros",
    //        "szerorecords": "no se encontraron resultados",
    //        "semptytable": "ningún dato disponible en esta tabla",
    //        "sinfo": "mostrando registros del _start_ al _end_ de un total de _total_ registros",
    //        "sinfoempty": "mostrando registros del 0 al 0 de un total de 0 registros",
    //        "sinfofiltered": "(filtrado de un total de _max_ registros)",
    //        "sinfopostfix": "",
    //        "ssearch": "buscar:",
    //        "surl": "",
    //        "sinfothousands": ",",
    //        "sloadingrecords": "cargando...",
    //        "opaginate": {
    //            "sfirst": "primero",
    //            "slast": "último",
    //            "snext": "siguiente",
    //            "sprevious": "anterior"
    //        },
    //        "oaria": {
    //            "ssortascending": ": activar para ordenar la columna de manera ascendente",
    //            "ssortdescending": ": activar para ordenar la columna de manera descendente"
    //        }
    //    }
    //});

});
