from django.shortcuts import render
from .models import *
from .utils import add_referer_stats, get_login_user, get_user_sub_feeds
import logging
from user_agents import parse
from django.conf import settings
from web.tasks import add_referer_stats_async

logger = logging.getLogger(__name__)


def index(request):
    """
    index home page
    :param request:
    :return:
    """
    # PC 版、手机版适配
    user_agent = parse(request.META.get('HTTP_USER_AGENT', ''))

    # 判断是否登录用户
    user = get_login_user(request)

    # 默认的渲染列表，区分是否登录用户
    if user is None:
        articles = Article.objects.filter(status='active', site__star__gte=20).order_by('-id')[:6]
    else:
        user_sub_feeds = get_user_sub_feeds(user.oauth_id)

        articles = Article.objects.filter(status='active', site__name__in=user_sub_feeds).order_by('-id')[:6]

    context = dict()
    context['articles'] = articles
    context['user'] = user
    context['github_oauth_key'] = settings.GITHUB_OAUTH_KEY

    # 记录访问来源
    add_referer_stats_async.delay(request.META.get('HTTP_REFERER', ''))

    if user_agent.is_pc:
        return render(request, 'index.html', context)
    else:
        return render(request, 'mobile/index.html', context)
