<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
?>
<div id="isepor">
    <h1><?php echo __('ISEPOR_TITLE'); ?></h1>
    <p style="width: 500px;  margin-bottom: 20px;">
        <?php echo __('ISEPOR_TEXT'); ?>
    </p>
    <?php foreach($questions as $question): ?>
        <div id="question-<?php echo $question['id'] ?>">
            <h2><?php echo htmlspecialchars($question['questions']) ?> <i>(<?php echo (int) $countUser[$question['id']]; ?>)</i>:</h2>
            <?php foreach($datas[$question['id']] as $key => $data): ?>
                <?php $pourcent = ((((int) $data['cmpt'])*100)/((int) $countUser[$question['id']])); ?>
                <div class="progressBarOutter">
                    <div class="progressBarInner" style="width: <?php echo $pourcent*2.44; ?>px">
                        <?php echo $pourcent; ?> % | <?php echo __('POST_SURVEY_NB_VOTES', array('votes' => (int) $data['cmpt'])); ?>
                    </div>
                </div>
                <div style="padding: 6px; float:left; width: 400px; margin-left: 10px; margin: 5px;">
                    <?php if($key == 0) : ?>
                        <b><?php echo $data['name'] ?></b>
                    <?php else : ?>
                        <?php echo $data['name'] ?>
                    <?php endif; ?>
                </div>
            <div class="clear">&nbsp;</div>
            <?php endforeach; ?>
        </div>
    <?php endforeach; ?>
</div>
