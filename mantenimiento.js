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

    var rescate = accesosusuario(1202);
    if (rescate == false) {
        alert("Su usuario no tiene permiso para esta opción...")
        window.location = "/Pages/AccesoRestringido";
        return;
    }

    var ProductoViewModel = function (data) {
        var self = this;

        self.Id = ko.observable(data.Id);
        self.CodigoProducto = ko.observable(data.CodigoProducto);
        self.NombreProducto = ko.observable(data.NombreProducto);
        self.PrecioOferta = ko.observable(data.PrecioOferta);
        self.PVP = ko.observable(data.PVP);
        self.PrecioCredito = ko.observable(data.PrecioCredito);
        self.Combo = ko.observable(data.Combo);

        return self;
    }

    function ProductosViewModel() {

        var self = this;

        self.Id = ko.observable("");
        self.CodigoProducto = ko.observable("");
        self.NombreProducto = ko.observable("");
        self.PrecioOferta = ko.observable("");
        self.PVP = ko.observable("");
        self.PrecioCredito = ko.observable("");
        self.Combo = ko.observable("");

        var Producto = {
            Id: self.Id,
            CodigoProducto: self.CodigoProducto,
            NombreProducto: self.NombreProducto,
            PrecioOferta: self.PrecioOferta,
            PVP: self.PVP,
            PrecioCredito: self.PrecioCredito,
            Combo: self.Combo
        };

        self.Producto = ko.observable();
        self.Productos = ko.observableArray();

        //Actualizar pantalla
        self.reloadData = function () {
            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_Productos",
                cache: false,
                async: false,
                type: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: {},
                success: function (result) {
                    self.Productos.removeAll();
                    ko.utils.arrayForEach(JSON.parse(result.d).Productos, function (data) {
                        self.Productos.push(new ProductoViewModel(data));
                    });
                }
            });
        }

        //Agregar nuevo
        self.instanciar = function () {
            Producto.Id("0");
            Producto.CodigoProducto("");
            Producto.NombreProducto("");
            Producto.PrecioOferta("");
            Producto.PVP("");
            Producto.PrecioCredito("");
            Producto.Combo("");

            self.Producto(Producto);

            $("#btnCrear").show();
            $("#btnActualizar").hide();
            $("#myModal").modal();
        }

        //Agregar nuevo
        self.create = function () {
            if (Producto.CodigoProducto() != "" ||
                Producto.NombreProducto() != "" ||
                Producto.PrecioOferta() != "" ||
                Producto.PVP() != "" ||
                Producto.PrecioCredito() != "" ||
                Producto.Combo() != "" ) {

                $.ajax({
                    url: ubicacionwegserv + "/web_preventa_online_ProductoCrear",
                    cache: false,
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8',
                    data: ko.toJSON(Producto),
                    success: function (data) {
                        $("#myModal").modal('hide');
                        self.reloadData();
                    }
                }).fail(
                function (xhr, textStatus, err) {
                    alert(err);
                });
            }
            else {
                alert('Ingrese los datos solicitados !!');
            }
        }

        //Eliminar row
        self.delete = function (Producto) {
            if (confirm('Está seguro de eliminar "' + Producto.NombreProducto() + '" ??')) {

                var parametros = new Object();
                parametros.Id = Producto.Id();

                var jsonText = JSON.stringify(parametros);

                $.ajax({
                    url: ubicacionwegserv + "/web_preventa_online_ProductoEliminar",
                    cache: false,
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8',
                    data: jsonText,
                    success: function (data) {
                        self.Productos.removeAll();
                        self.reloadData();
                    }
                }).fail(
                function (xhr, textStatus, err) {
                    self.status(err);
                });
            }
        }

        //Editar row
        self.edit = function (Producto) {
            self.Producto(Producto);
            $("#btnCrear").hide();
            $("#btnActualizar").show();
            $("#myModal").modal();
        }

        //Editar row
        self.update = function () {
            var Producto = self.Producto();
            $.ajax({
                url: ubicacionwegserv + "/web_preventa_online_ProductoActualizar",
                cache: false,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: ko.toJSON(Producto),
                success: function (data) {
                    $("#myModal").modal('hide');
                    self.reloadData();
                }
            })
            .fail(
            function (xhr, textStatus, err) {
                alert(err);
            });
        }

        //Reset Producto 
        self.reset = function () {
            self.CodigoProducto("");
            self.NombreProducto("");
            self.PrecioOferta("");
            self.PVP("");
            self.PrecioCredito("");
            self.Combo("");
        }

        //Cancelar Producto
        self.cancel = function () {
            self.Producto(null);
            $("#myModal").modal('hide');
        }

        self.reloadData();

        return self;
    }

    var viewModel = new ProductosViewModel();
    ko.applyBindings(viewModel);

    //$('.dataTables-Productos').DataTable({
    //    dom: '<"html5buttons"B>lTfgitp',
    //    buttons: [
    //        { extend: 'copy' },
    //        { extend: 'csv' },
    //        { extend: 'excel', title: 'PedidosCliente' },
    //        { extend: 'pdf', title: 'PedidosCliente' },

    //        {
    //            extend: 'print',
    //            customize: function (win) {
    //                $(win.document.body).addClass('white-bg');
    //                $(win.document.body).css('font-size', '10px');

    //                $(win.document.body).find('table')
    //                        .addClass('compact')
    //                        .css('font-size', 'inherit');
    //            }
    //        }
    //    ],
    //    language: {
    //        "sProcessing": "Procesando...",
    //        "sLengthMenu": "Mostrar _MENU_ registros",
    //        "sZeroRecords": "No se encontraron resultados",
    //        "sEmptyTable": "Ningún dato disponible en esta tabla",
    //        "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
    //        "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
    //        "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
    //        "sInfoPostFix": "",
    //        "sSearch": "Buscar:",
    //        "sUrl": "",
    //        "sInfoThousands": ",",
    //        "sLoadingRecords": "Cargando...",
    //        "oPaginate": {
    //            "sFirst": "Primero",
    //            "sLast": "Último",
    //            "sNext": "Siguiente",
    //            "sPrevious": "Anterior"
    //        },
    //        "oAria": {
    //            "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
    //            "sSortDescending": ": Activar para ordenar la columna de manera descendente"
    //        }
    //    }
    //});
});
