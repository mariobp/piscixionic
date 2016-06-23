#!/usr/bin/env python
# -*- coding: utf-8 -*-
from django.shortcuts import render
from django.utils.decorators import method_decorator
from supra import views as supra
import models
import forms
from django.views.decorators.csrf import csrf_exempt

supra.SupraConf.ACCECC_CONTROL["allow"] = True


"""
Actividad: T053
Requerimientos: R036,R037
Backend Modelo, Formulario, Admin y Servicio: R. Mantenimientos
"""


class FotoMantenimientoInlineFormView(supra.SupraInlineFormView):
    model = models.FotoSolucion
    extra = 1
# end class


class FotoFormView(supra.SupraFormView):
    model = models.FotoSolucion

    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super(FotoFormView, self).dispatch(request, *args, **kwargs)
    # end def
# end class


class MantenimientoFormView(supra.SupraFormView):
    model = models.Solucion
    form_class = forms.SolucionForm
    #inlines = [FotoMantenimientoInlineFormView]

    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super(MantenimientoFormView, self).dispatch(request, *args, **kwargs)
    # end def
# end class


class MantenimientoListView(supra.SupraListView):
    model = models.Solucion
    list_display = ['pk', 'nombre', 'reporte__nombre',
                    'nombreC', 'apellidosC', 'descripcion', 'fecha', 'cliente_id', 'tipo__nombre']
    search_fields = list_display
    list_filter = ('reporte', 'emisor')
    paginate_by = 10

    class Renderer:
        nombreC = 'reporte__piscina__casa__cliente__first_name'
        apellidosC = 'reporte__piscina__casa__cliente__last_name'
        cliente_id = 'reporte__piscina__casa__cliente__id'
    # end class

	def get_queryset(self):
		queryset = super(MantenimientoListView, self).get_queryset()
		return queryset.order_by('-fecha')
    # end def
# end class

class FotoMantenimientoListView(supra.SupraListView):
    list_filter = ['pk', 'mantenimiento']
    list_display = ['url',]
    model = models.FotoSolucion
# end class

class TipoSolucionListView(supra.SupraListView):
    list_display = ('nombre', 'id')
    model = models.TipoSolucion
# end class

"""
Actividad: T054
Requerimientos: R038,R039
Backend Modelo, Formulaio, Admin y Servicio: R. Reparaciones



class FotoReparacionInlineFormView(supra.SupraInlineFormView):
    model = models.FotoReparacion
    extra = 1

    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super(FotoReparacionInlineFormView, self).dispatch(request, *args, **kwargs)
    # end def
# end class


class ReparacionFormView(supra.SupraFormView):
    model = models.Reparacion
    form_class = forms.ReparacionForm
    #inlines = [FotoReparacionInlineFormView]

    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super(ReparacionFormView, self).dispatch(request, *args, **kwargs)
    # end def
# end class


class ReparacionListView(supra.SupraListView):
    model = models.Reparacion
    list_display = ['pk', 'nombre', 'piscina__nombre',
                    'nombreC', 'apellidosC', 'descripcion', 'fecha']
    search_fields = list_display
    list_filter = ('piscina', 'emisor')
    paginate_by = 10

    class Renderer:
        nombreC = 'piscina__casa__cliente__first_name'
        apellidosC = 'piscina__casa__cliente__last_name'
    # end class
# end class

class FotoReparacionListView(supra.SupraListView):
    list_filter = ['pk', 'reparacion']
    list_display = ['url',]
    model = models.FotoReparacion
# end class
"""
